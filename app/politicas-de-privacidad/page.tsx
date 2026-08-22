import Link from 'next/link'
import { Database, Eye, FileText, LockKeyhole, Mail, ShieldCheck, UserX, Users } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { Card, CardContent } from '@/components/ui/card'

export const metadata = {
  title: 'Política de Privacidad | Lucky Bingo Bear',
  description: 'Política de privacidad y tratamiento de datos personales de Lucky Bingo Bear.',
}

const lastUpdated = '11 de junio de 2026'

export default function PrivacyPage() {
  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-zinc-100">
      <div className="lbb-ambient" />
      <SiteHeader kicker="Privacidad" compact />
      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-[104px] sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center rounded-full bg-emerald-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-zinc-950">
            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
            Datos personales
          </div>
          <h1 className="font-mono text-4xl font-black leading-none text-white sm:text-6xl">Política de Privacidad</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300">
            Última actualización: {lastUpdated}. Esta política explica cómo Lucky Bingo Bear recolecta, usa, conserva y protege los datos personales de sus usuarios.
          </p>
        </div>

        <Card className="border-emerald-300/20 bg-zinc-950/85 text-zinc-100 shadow-2xl shadow-black/25">
          <CardContent className="space-y-8 p-5 sm:p-8">
            <LegalSection icon={<Users />} title="1. Responsable del tratamiento">
              <p>Nombre comercial: Lucky Bingo Bear.</p>
              <p>Titular / Razón social: Rodrigo Nicolás Gomez.</p>
              <p>CUIL: 20-39319599-2.</p>
              <p>Domicilio y jurisdicción: Maipú 3507, Formosa, Formosa, República Argentina.</p>
              <p>Correo de privacidad: <a className="text-emerald-200 underline" href="mailto:rodrigonicolasgomez@outlook.com">rodrigonicolasgomez@outlook.com</a>.</p>
              <p>Sitio web: <a className="text-emerald-200 underline" href="https://www.luckybingbear.com">www.luckybingbear.com</a>.</p>
            </LegalSection>

            <LegalSection icon={<Database />} title="2. Datos recolectados">
              <p>La plataforma podrá recolectar nombre y apellido, DNI/CUIL/CUIT, domicilio, teléfono, correo electrónico, datos de cuenta de usuario, datos de pago, alias, CBU, CVU, billetera virtual, comprobantes, archivos cargados, historial de participación, cartones, sorteos, premios, comunicaciones con soporte, dirección IP, dispositivo, navegador, sistema operativo y datos técnicos de uso.</p>
              <p>Los datos solicitados procurarán ser adecuados, pertinentes y necesarios para las finalidades informadas.</p>
            </LegalSection>

            <LegalSection icon={<FileText />} title="3. Finalidades">
              <p>Los datos serán utilizados para registrar usuarios, administrar cuentas, recordar datos de jugador, gestionar compras de cartones, validar pagos y comprobantes, emitir cartones, controlar participación, prevenir fraude, determinar ganadores, coordinar pagos o entrega de premios, brindar soporte, responder reclamos, enviar comunicaciones operativas, mejorar seguridad y cumplir obligaciones legales o administrativas.</p>
            </LegalSection>

            <LegalSection icon={<ShieldCheck />} title="4. Base de tratamiento">
              <p>El tratamiento se realiza sobre la base del consentimiento del usuario, la ejecución de la relación con la plataforma, el cumplimiento de obligaciones legales y el interés legítimo de verificar pagos, prevenir fraude, proteger la seguridad del sistema y resolver reclamos.</p>
            </LegalSection>

            <LegalSection icon={<LockKeyhole />} title="5. Seguridad y conservación">
              <p>Lucky Bingo Bear adoptará medidas técnicas, organizativas y administrativas razonables para proteger los datos contra acceso no autorizado, pérdida, alteración, uso indebido o divulgación.</p>
              <p>Los datos serán conservados durante el tiempo necesario para cumplir las finalidades informadas, validar participaciones, resolver reclamos, prevenir fraude, cumplir obligaciones legales y preservar evidencia ante eventuales controversias.</p>
            </LegalSection>

            <LegalSection icon={<Users />} title="6. Proveedores y terceros">
              <p>La plataforma podrá compartir datos cuando sea necesario con proveedores tecnológicos, hosting, base de datos, almacenamiento, proveedores de pago como Mercado Pago, entidades financieras, servicios de comunicación, soporte, asesores legales o contables y autoridades públicas cuando corresponda.</p>
              <p>Lucky Bingo Bear no venderá datos personales de los usuarios.</p>
            </LegalSection>

            <LegalSection icon={<Eye />} title="7. Publicación de ganadores">
              <p>La plataforma podrá publicar información limitada de ganadores con fines de transparencia, comunicación o promoción, como nombre parcial, alias, ciudad, cartón ganador o premio obtenido, evitando exponer datos sensibles o innecesarios.</p>
              <p>La publicación de fotografías, videos o testimonios identificables requerirá autorización previa cuando corresponda.</p>
            </LegalSection>

            <LegalSection icon={<UserX />} title="8. Menores de edad">
              <p>La plataforma no está dirigida a menores de edad y no permite su participación. Si se detecta una participación de una persona menor de edad, la cuenta, cartón o participación podrá ser anulada y los datos podrán ser eliminados o bloqueados, salvo conservación por razones legales o probatorias.</p>
            </LegalSection>

            <LegalSection icon={<Database />} title="9. Cookies y almacenamiento local">
              <p>Lucky Bingo Bear podrá utilizar cookies, almacenamiento local u otras tecnologías para mantener sesiones activas, recordar preferencias, vincular cartones a un navegador, medir uso, analizar errores, mejorar funcionamiento y proteger la seguridad.</p>
            </LegalSection>

            <LegalSection icon={<Mail />} title="10. Derechos y contacto">
              <p>El usuario podrá solicitar acceso, rectificación, actualización o supresión de sus datos personales cuando corresponda.</p>
              <p>Para ejercer estos derechos deberá comunicarse a <a className="text-emerald-200 underline" href="mailto:rodrigonicolasgomez@outlook.com">rodrigonicolasgomez@outlook.com</a> indicando datos suficientes para identificar al titular y procesar el pedido.</p>
              <p>La supresión podrá no proceder cuando exista obligación legal de conservación, pagos o premios pendientes, reclamos, auditoría, prevención de fraude o validación de participaciones.</p>
            </LegalSection>

            <LegalSection icon={<FileText />} title="11. Cambios y aceptación">
              <p>Lucky Bingo Bear podrá modificar esta política en cualquier momento. Las modificaciones serán publicadas en el sitio y tendrán vigencia desde su publicación.</p>
              <p>Esta política debe leerse junto con los <Link className="text-emerald-200 underline" href="/terminos-y-condiciones">Términos y Condiciones</Link>.</p>
            </LegalSection>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function LegalSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <h2 className="mb-3 flex items-center gap-2 text-xl font-black text-white">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-300 text-zinc-950">{icon}</span>
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-7 text-zinc-300">{children}</div>
    </section>
  )
}
