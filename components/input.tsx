import { FC } from 'react'

interface Props {
  labelText: string
  placeholder: string
  type: string
  required: boolean
  disabled: boolean
  value: string | number
  onChange: any
}

export const Input: FC<Props> = ({
  labelText,
  placeholder,
  type,
  required,
  disabled,
  value,
  onChange,
}) => {
  let inputStyle =
    'form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none'
  if (disabled) {
    inputStyle =
      'form-control block w-full px-4 py-2 text-base font-light text-gray-200 bg-white bg-clip-padding border border-solid border-[#FFF2CE] rounded-full'
  }
  return (
    <div>
      <label className="form-label inline-block ml-3 text-black text-base">
        {labelText}
      </label>
      <input
        className={inputStyle}
        placeholder={placeholder}
        type={type}
        required={required}
        disabled={disabled}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}
