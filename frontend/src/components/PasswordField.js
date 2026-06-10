import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PasswordField = ({ label, value, onChange, placeholder, name, id, className = "", disabled = false }) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`form-group ${className}`} style={{ position: 'relative', marginBottom: '1rem' }}>
      {label && <label htmlFor={id || name} className="form-label">{label}</label>}
      <div className="password-input-wrapper" style={{ position: 'relative' }}>
        <input
          type={showPassword ? 'text' : 'password'}
          id={id || name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder || 'Enter password'}
          className="form-control"
          style={{ paddingRight: '45px' }}
          required
          disabled={disabled}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            zIndex: 10,
            padding: '5px'
          }}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
};

export default PasswordField;