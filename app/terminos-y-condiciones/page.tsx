import Link from 'next/link'
import { ShieldCheck, Scale, AlertTriangle, Ticket, WalletCards, Trophy, Ban, RefreshCcw, Mail } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { Card, CardContent } from '@/components/ui/card'

export const metadata = {
  title: 'Términos y Condiciones | Lucky Bingo Bear',
  description: 'Términos y condiciones de uso de Lucky Bingo Bear.',
}

const lastUpdated = '11 de junio de 2026'

export default function TermsPage() {
  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-zinc-100">
      <div className="lbb-ambient" />
      <SiteHeader kicker="Marco legal" compact />

      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-[104px] sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center rounded-full bg-amber-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-zinc-950">
            <Scale className="mr-1 h-3.5 w-3.5" />
            Documento legal
          </div>
          <h1 className="font-mono text-4xl font-black leading-none text-white sm:text-6xl">Términos y Condiciones</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300">
            Última actualización: {lastUpdated}. Este documento regula el acceso, registro, compra de cartones, validación de pagos, participación en sorteos y cobro de premios en Lucky Bingo Bear.
          </p>
        </div>

        <Card className="border-amber-300/20 bg-zinc-950/85 text-zinc-100 shadow-2xl shadow-black/25">
          <CardContent className="space-y-8 p-5 sm:p-8">
            <LegalSection icon={<ShieldCheck />} title="1. Identificación del responsable">
              <p>Nombre comercial: Lucky Bingo Bear.</p>
              <p>Titular / Razón social: Rodrigo Nicolás Gomez.</p>
              <p>CUIL: 20-39319599-2.</p>
              <p>Domicilio y jurisdicción: Maipú 3507, Formosa, Formosa, República Argentina.</p>
              <p>Correo oficial de contacto: <a className="text-amber-200 underline" href="mailto:rodrigonicolasgomez@outlook.com">rodrigonicolasgomez@outlook.com</a>.</p>
              <p>Sitio web: <a className="text-amber-200 underline" href="https://www.luckybingbear.com">www.luckybingbear.com</a>.</p>
            </LegalSection>

            <LegalSection icon={<Ticket />} title="2. Naturaleza de la plataforma">
              <p>Lucky Bingo Bear es una plataforma digital orientada a la organización, administración, promoción y participación en sorteos, bingos, rifas, dinámicas promocionales o actividades similares que se encuentren habilitadas en cada momento.</p>
              <p>Cada sorteo podrá tener condiciones particulares: fecha, horario, precio, premios, cantidad de cartones, modalidad de participación, forma de validación de pagos y procedimiento de entrega o pago de premios.</p>
              <p>La participación puede requerir la adquisición de uno o más cartones digitales identificados con códigos únicos emitidos por la plataforma.</p>
            </LegalSection>

            <LegalSection icon={<AlertTriangle />} title="3. Mayoría de edad y capacidad legal">
              <p>La plataforma está destinada exclusivamente a personas mayores de 18 años o a quienes tengan la edad legal mínima exigida por la normativa aplicable para participar en este tipo de actividades.</p>
              <p>Al registrarse o participar, el usuario declara bajo juramento que es mayor de edad, posee capacidad legal suficiente, utiliza datos propios, reales y verificables, y no facilita la participación de menores de edad.</p>
              <p>Lucky Bingo Bear podrá solicitar documentación adicional para verificar identidad, edad, titularidad de medios de pago o legitimidad de la participación.</p>
            </LegalSection>

            <LegalSection icon={<Scale />} title="4. Cumplimiento legal y jurisdiccional">
              <p>El usuario reconoce que las actividades vinculadas a juegos de azar, bingos, rifas, sorteos o dinámicas similares pueden estar sujetas a autorización, licencia, control o regulación nacional, provincial, municipal o de la jurisdicción correspondiente.</p>
              <p>Lucky Bingo Bear podrá limitar, suspender o rechazar la participación de usuarios ubicados en jurisdicciones donde la actividad no esté permitida o resulte incompatible con la normativa aplicable.</p>
              <p>La plataforma podrá adaptar, suspender o modificar sus servicios ante requerimientos legales, administrativos, regulatorios, operativos o técnicos.</p>
            </LegalSection>

            <LegalSection icon={<Ticket />} title="5. Registro, cuenta de usuario y datos del participante">
              <p>Para comprar cartones y participar, el usuario deberá ingresar o crear una cuenta mediante correo electrónico y completar sus datos de jugador.</p>
              <p>Los datos requeridos podrán incluir nombre y apellido, DNI, domicilio, teléfono, correo electrónico, alias/CBU/CVU, titularidad de cuenta de cobro, comprobante de pago y demás datos razonablemente necesarios para validar identidad, pago, participación o premio.</p>
              <p>El usuario se obliga a mantener información veraz, completa, actualizada y legítima. Lucky Bingo Bear no será responsable por pérdidas, demoras, rechazos o imposibilidad de cobro derivados de datos falsos, incompletos o desactualizados.</p>
            </LegalSection>

            <LegalSection icon={<WalletCards />} title="6. Pagos y comprobantes">
              <p>El medio oficial de pago informado para la plataforma es Mercado Pago, sin perjuicio de las cuentas, alias o instrucciones específicas que se indiquen dentro de cada sorteo.</p>
              <p>La carga de un comprobante no implica validación automática del pago. El comprobante podrá ser contrastado con los movimientos reales de la cuenta receptora.</p>
              <p>La única prueba definitiva de pago será la acreditación efectiva del dinero en la cuenta indicada por Lucky Bingo Bear.</p>
              <p>Un comprobante falso, adulterado, duplicado, incompleto, ilegible, ajeno, perteneciente a otra operación o no coincidente con los datos cargados no generará derecho de participación ni de cobro.</p>
            </LegalSection>

            <LegalSection icon={<Ticket />} title="7. Cartones, identificadores y participación válida">
              <p>Cada cartón, número, código o identificador emitido por la plataforma será único y estará vinculado a un usuario, sorteo y comprobante de pago determinado.</p>
              <p>La emisión visual o digital de un cartón no implica por sí sola validación definitiva de la participación ni derecho automático a cobrar premios.</p>
              <p>Para que un cartón participe oficialmente, deberá estar emitido por canales oficiales, asociado a datos válidos, vinculado a un pago real y tener estado de pago aprobado por la administración.</p>
              <p>Lucky Bingo Bear podrá anular cartones emitidos por error, falla técnica, manipulación, fraude, duplicación, pago no acreditado o incumplimiento de estos términos.</p>
            </LegalSection>

            <LegalSection icon={<Trophy />} title="8. Premios y validación del ganador">
              <p>Los premios, su monto, naturaleza, forma de pago, fecha estimada de entrega y condiciones particulares serán informados en cada sorteo.</p>
              <p>La sola tenencia de un cartón ganador, captura de pantalla, comprobante cargado o visualización de un resultado favorable no genera derecho automático al cobro.</p>
              <p>Antes de pagar cualquier premio, Lucky Bingo Bear podrá verificar identidad, mayoría de edad, validez del cartón, coincidencia entre usuario, sorteo y comprobante, acreditación efectiva del pago y ausencia de fraude o irregularidades.</p>
              <p>Si el pago no fue acreditado, el comprobante es falso, inválido, duplicado, no verificable o no coincide con el cartón ganador, la participación podrá ser anulada y el premio rechazado.</p>
            </LegalSection>

            <LegalSection icon={<Ban />} title="9. Conductas prohibidas">
              <p>Queda prohibido participar siendo menor de edad, usar datos falsos o de terceros, cargar comprobantes inválidos o fraudulentos, manipular cartones, resultados o sistemas, usar bots o scripts, revender cartones sin autorización, realizar reclamos fraudulentos o utilizar la plataforma para actividades ilícitas.</p>
              <p>El incumplimiento podrá derivar en suspensión de cuenta, bloqueo, anulación de cartones, pérdida de premios, denuncia ante autoridades competentes y reclamos por daños y perjuicios.</p>
            </LegalSection>

            <LegalSection icon={<RefreshCcw />} title="10. Cancelaciones, suspensiones, reintegros y modificaciones">
              <p>Lucky Bingo Bear podrá cancelar, suspender, reprogramar o modificar un sorteo por razones técnicas, operativas, legales, comerciales, fuerza mayor, fraude, baja participación, errores de configuración u otra causa razonable.</p>
              <p>En caso de cancelación de un sorteo pago, podrá ofrecerse reprogramación, reasignación a otro sorteo, devolución del importe efectivamente acreditado u otra solución razonable informada al usuario.</p>
              <p>No corresponderá devolución cuando el comprobante sea inválido, falso o no verificable, cuando el pago no haya sido acreditado o cuando el usuario haya participado válidamente del sorteo ya realizado.</p>
            </LegalSection>

            <LegalSection icon={<ShieldCheck />} title="11. Juego responsable">
              <p>Lucky Bingo Bear promueve el uso responsable de la plataforma. El usuario reconoce que este tipo de dinámicas puede implicar riesgo económico.</p>
              <p>Se recomienda participar únicamente con dinero disponible, no endeudarse para jugar, no perseguir pérdidas, establecer límites personales y solicitar ayuda profesional si considera que tiene problemas con el juego.</p>
              <p>La plataforma podrá implementar advertencias, límites, bloqueos, autoexclusión o suspensión de usuarios cuando detecte o reciba alertas sobre uso problemático.</p>
            </LegalSection>

            <LegalSection icon={<Scale />} title="12. Propiedad intelectual y disponibilidad del servicio">
              <p>Los textos, interfaces, logotipos, ilustraciones, personajes, cartones, diseños, bases de datos, código, imágenes y demás elementos de Lucky Bingo Bear pertenecen a sus titulares o licenciantes.</p>
              <p>Queda prohibida la copia, reproducción, distribución, modificación, venta, ingeniería inversa o explotación no autorizada de cualquier elemento de la plataforma.</p>
              <p>La plataforma podrá no estar disponible temporalmente por mantenimiento, actualizaciones, fallas de proveedores, conectividad, ataques informáticos, fuerza mayor u otras causas ajenas al control del responsable.</p>
            </LegalSection>

            <LegalSection icon={<Mail />} title="13. Comunicaciones, soporte y reclamos">
              <p>Lucky Bingo Bear podrá comunicarse por correo electrónico, WhatsApp, teléfono, notificaciones internas, redes sociales u otros canales informados por el usuario.</p>
              <p>Los reclamos deberán formularse de manera clara, respetuosa y dentro de un plazo razonable desde ocurrido el hecho reclamado.</p>
              <p>Canal oficial de contacto: <a className="text-amber-200 underline" href="mailto:rodrigonicolasgomez@outlook.com">rodrigonicolasgomez@outlook.com</a>.</p>
            </LegalSection>

            <LegalSection icon={<Scale />} title="14. Ley aplicable, jurisdicción y aceptación">
              <p>Estos términos se rigen por las leyes de la República Argentina y la normativa provincial, municipal o jurisdiccional que resulte aplicable según el domicilio, operación, modalidad del sorteo y ubicación de la actividad.</p>
              <p>Ante cualquier controversia, las partes procurarán resolverla de manera amistosa. Si no fuera posible, serán competentes los tribunales ordinarios con jurisdicción en Formosa, Formosa, Argentina, salvo que una norma imperativa disponga otra competencia.</p>
              <p>Al registrarse, comprar cartones, cargar comprobantes, participar o reclamar premios, el usuario declara haber leído, comprendido y aceptado estos Términos y Condiciones y la <Link className="text-amber-200 underline" href="/politicas-de-privacidad">Política de Privacidad</Link>.</p>
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
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-300 text-zinc-950">{icon}</span>
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-7 text-zinc-300">{children}</div>
    </section>
  )
}
