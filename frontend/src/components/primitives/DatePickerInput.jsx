import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from 'lucide-react';

const CustomInput = forwardRef(({ value, onClick, placeholder, className }, ref) => (
  <div className={`relative w-full ${className}`} onClick={onClick} ref={ref}>
    <input
      type="text"
      value={value}
      readOnly
      placeholder={placeholder}
      className="w-full rounded-lg border border-border-strong bg-paper px-3 py-2 text-sm outline-none focus:border-accent pl-10 cursor-pointer font-medium text-ink transition-colors hover:border-border-default"
    />
    <Calendar className="w-4 h-4 text-ink-soft absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
));

export default function DatePickerInput({ selected, onChange, placeholder = "Select Date", dateFormat="dd/MM/yyyy", showMonthYearPicker = false, minDate = null, maxDate = null, className="" }) {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      dateFormat={dateFormat}
      showMonthYearPicker={showMonthYearPicker}
      minDate={minDate}
      maxDate={maxDate}
      customInput={<CustomInput placeholder={placeholder} className={className} />}
    />
  );
}
