import os
import tempfile
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Header, HTTPException, UploadFile

app = FastAPI(title="Lucky Bingo Bear PaddleOCR")

_ocr: Any | None = None


def require_api_key(authorization: str | None) -> None:
    expected = os.getenv("PADDLE_OCR_API_KEY", "").strip()
    if not expected:
        return

    if authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="Invalid OCR API key")


def get_ocr() -> Any:
    global _ocr
    if _ocr is None:
        from paddleocr import PaddleOCR

        lang = os.getenv("PADDLE_OCR_LANG", "en")
        _ocr = PaddleOCR(use_angle_cls=True, lang=lang, show_log=False)
    return _ocr


def flatten_result(result: Any) -> tuple[list[dict[str, Any]], float | None]:
    lines: list[dict[str, Any]] = []
    confidences: list[float] = []

    def visit(node: Any) -> None:
        if isinstance(node, (list, tuple)):
            if len(node) >= 2 and isinstance(node[1], (list, tuple)) and node[1]:
                text = node[1][0]
                confidence = node[1][1] if len(node[1]) > 1 else None
                if isinstance(text, str) and text.strip():
                    item = {"text": text.strip()}
                    if isinstance(confidence, (int, float)):
                        score = max(0.0, min(1.0, float(confidence)))
                        item["confidence"] = score
                        confidences.append(score)
                    lines.append(item)
                    return

            for child in node:
                visit(child)

    visit(result)
    average = sum(confidences) / len(confidences) if confidences else None
    return lines, average


@app.get("/health")
def health() -> dict[str, str]:
    return {"ok": "true"}


@app.post("/ocr")
async def ocr(file: UploadFile = File(...), authorization: str | None = Header(default=None)) -> dict[str, Any]:
    require_api_key(authorization)

    suffix = Path(file.filename or "receipt").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}:
        raise HTTPException(status_code=415, detail="Only image receipts are supported")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(content) > int(os.getenv("PADDLE_OCR_MAX_BYTES", str(12 * 1024 * 1024))):
        raise HTTPException(status_code=413, detail="File too large")

    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
            temp.write(content)
            temp_path = temp.name

        result = get_ocr().ocr(temp_path, cls=True)
        lines, confidence = flatten_result(result)
        raw_text = "\n".join(line["text"] for line in lines)

        return {
            "engine": "paddle_ocr",
            "rawText": raw_text,
            "confidence": confidence,
            "lines": lines,
        }
    finally:
        if temp_path:
            Path(temp_path).unlink(missing_ok=True)
