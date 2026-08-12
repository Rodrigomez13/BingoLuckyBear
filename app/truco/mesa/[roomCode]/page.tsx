import { notFound, redirect } from 'next/navigation'

type Props = { params: Promise<{ roomCode: string }> }

export default async function TrucoTablePage({ params }: Props) {
  const roomCode = (await params).roomCode.toUpperCase()
  if (!/^[A-Z0-9]{5}$/.test(roomCode)) notFound()
  redirect(`/truco?sala=${roomCode}`)
}
