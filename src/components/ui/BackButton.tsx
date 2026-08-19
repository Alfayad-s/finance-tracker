import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function BackButton({
  to,
  label,
}: {
  to: string
  label: string
}) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        if (window.history.length > 1) {
          navigate(-1)
          return
        }
        navigate(to)
      }}
      className="-ml-2 shrink-0 rounded-full p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
    >
      <ChevronLeft className="size-5" aria-hidden />
    </button>
  )
}
