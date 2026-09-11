import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import type { Control, FieldErrors } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import type { ProjectOptions } from './projects.api'
import type { CreateProjectValues } from './projects.schema'

interface ProjectFormFieldsProps {
  control: Control<CreateProjectValues>
  errors: FieldErrors<CreateProjectValues>
  options: ProjectOptions
}

export function ProjectFormFields({ control, errors, options }: ProjectFormFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-[15px] font-semibold text-slate-800">
          Project name
        </label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <InputText
              id="name"
              autoFocus
              placeholder="e.g. Riverside Villas — Block A"
              className="w-full"
              invalid={Boolean(errors.name)}
              {...field}
            />
          )}
        />
        {errors.name && <small className="text-[13px] text-red-600">{errors.name.message}</small>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="type" className="text-[15px] font-semibold text-slate-800">
          Project Type
        </label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Dropdown
              inputId="type"
              value={field.value}
              options={options.types}
              optionLabel="label"
              optionValue="value"
              placeholder="Select a type"
              onChange={(e) => field.onChange(e.value)}
              className="w-full"
            />
          )}
        />
        {errors.type && <small className="text-[13px] text-red-600">{errors.type.message}</small>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="status" className="text-[15px] font-semibold text-slate-800">
          Project Status
        </label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Dropdown
              inputId="status"
              value={field.value}
              options={options.statuses}
              optionLabel="label"
              optionValue="value"
              onChange={(e) => field.onChange(e.value)}
              className="w-full"
            />
          )}
        />
        {errors.status && <small className="text-[13px] text-red-600">{errors.status.message}</small>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-[15px] font-semibold text-slate-800">
          Description <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <InputTextarea
              id="description"
              rows={3}
              autoResize
              placeholder="A short summary of the project"
              className="w-full"
              {...field}
            />
          )}
        />
      </div>
    </>
  )
}
