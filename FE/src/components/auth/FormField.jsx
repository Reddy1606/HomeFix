import { useState } from 'react';

export default function FormField({
  label,
  name,
  error,
  hint,
  type = 'text',
  ...props
}) {
  const [visible, setVisible] = useState(false);
  const password = type === 'password';
  return (
    <div className="hf-field">
      <label htmlFor={name}>
        {label}
        {props.required && <span aria-hidden="true"> *</span>}
      </label>
      <div className="hf-input-wrap">
        <input
          {...props}
          id={name}
          name={name}
          type={password && visible ? 'text' : type}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${name}-error` : hint ? `${name}-hint` : undefined
          }
          className={password ? 'has-toggle' : ''}
        />
        {password && (
          <button
            type="button"
            className="password-toggle"
            aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? 'Ẩn' : 'Hiện'}
          </button>
        )}
      </div>
      {error ? (
        <p className="hf-field-error" id={`${name}-error`}>
          {error}
        </p>
      ) : (
        hint && (
          <p className="hf-hint" id={`${name}-hint`}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}
