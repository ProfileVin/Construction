import { passwordChecks } from './auth.schema'

/** Live two-column checklist of the password requirements. */
export function PasswordChecklist({ value }: { value: string }) {
  return (
    <ul className="mt-1 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
      {passwordChecks.map((check) => {
        const ok = check.test(value)
        return (
          <li
            key={check.id}
            className={`flex items-center gap-2 text-[13px] ${ok ? 'text-brand' : 'text-slate-400'}`}
          >
            <i className={`pi ${ok ? 'pi-check-circle' : 'pi-circle'} text-[12px]`} />
            {check.label}
          </li>
        )
      })}
    </ul>
  )
}
