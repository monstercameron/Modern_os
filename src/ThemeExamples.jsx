/**
 * Example components demonstrating the Metro OS theming system
 * These show best practices for using the theme context and utilities
 */

import React from 'react';
import { useTheme, themeVar, themedBg, themedText, themedBorder } from './ThemeContext';

// ============================================================================
// EXAMPLE 1: Simple themed button using helper functions
// ============================================================================
export function ThemedButton({ children, onClick, variant = 'primary' }) {
  const { theme } = useTheme();
  
  const styles = variant === 'primary' 
    ? {
        ...themedBg('accent'),
        color: theme.surface, // Inverse color for contrast
        border: 'none'
      }
    : {
        ...themedBg('surface'),
        ...themedText(),
        ...themedBorder(),
        borderWidth: '1px',
        borderStyle: 'solid'
      };
  
  return (
    <button
      onClick={onClick}
      style={{
        ...styles,
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.2s'
      }}
    >
      {children}
    </button>
  );
}

// ============================================================================
// EXAMPLE 2: Themed card component
// ============================================================================
export function ThemedCard({ title, children, className = '' }) {
  return (
    <div 
      className={className}
      style={{
        ...themedBg('surface'),
        ...themedBorder(),
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      {title && (
        <h3 style={{ ...themedText(), marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>
          {title}
        </h3>
      )}
      <div style={themedText()}>
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Theme status indicator
// ============================================================================
export function ThemeIndicator() {
  const { currentTheme, isLight, isDark, isCustom, theme } = useTheme();
  
  return (
    <div style={{
      ...themedBg('surface'),
      ...themedBorder(),
      borderWidth: '1px',
      borderStyle: 'solid',
      padding: '8px 12px',
      borderRadius: '6px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <div 
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: theme.accent
        }}
      />
      <span style={{ ...themedText(), fontSize: '14px' }}>
        {isLight ? '☀️ Light' : isDark ? '🌙 Dark' : '🎨 Custom'} Theme
      </span>
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Using CSS variables directly in className
// ============================================================================
export function ThemedPanel({ children }) {
  return (
    <div 
      className="p-4 rounded-lg"
      style={{
        backgroundColor: themeVar('surface'),
        borderColor: themeVar('border'),
        borderWidth: '1px',
        borderStyle: 'solid',
        color: themeVar('text')
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Responsive themed navbar
// ============================================================================
export function ThemedNavbar({ items = [], onItemClick }) {
  const { theme } = useTheme();
  
  return (
    <nav style={{
      ...themedBg('surface'),
      ...themedBorder(),
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid',
      padding: '12px 24px',
      display: 'flex',
      gap: '16px',
      alignItems: 'center'
    }}>
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => onItemClick?.(item)}
          style={{
            ...themedText(),
            background: 'none',
            border: 'none',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s',
            borderRadius: '4px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.accent;
            e.currentTarget.style.color = theme.surface;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.text;
          }}
        >
          {item}
        </button>
      ))}
    </nav>
  );
}

// ============================================================================
// EXAMPLE 6: Advanced themed input field
// ============================================================================
export function ThemedInput({ label, value, onChange, placeholder }) {
  const { theme } = useTheme();
  
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{
          ...themedText(),
          display: 'block',
          marginBottom: '6px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {label}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          ...themedBg('background'),
          ...themedText(),
          ...themedBorder(),
          borderWidth: '1px',
          borderStyle: 'solid',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '14px',
          width: '100%',
          outline: 'none',
          transition: 'border-color 0.2s'
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = theme.accent}
        onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: Complete themed component showcase
// ============================================================================
export function ThemeShowcase() {
  const { toggleLightDark, theme, getColor } = useTheme();
  
  return (
    <div style={{
      ...themedBg('background'),
      minHeight: '100vh',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ ...themedText(), marginBottom: '24px' }}>
          Theming System Showcase
        </h1>
        
        <div style={{ marginBottom: '24px' }}>
          <ThemeIndicator />
        </div>
        
        <div style={{ display: 'grid', gap: '16px' }}>
          <ThemedCard title="Color Palette">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
              {['accent', 'background', 'surface', 'text', 'border'].map(key => (
                <div key={key} style={{ textAlign: 'center' }}>
                  <div 
                    style={{
                      width: '100%',
                      height: '60px',
                      backgroundColor: getColor(key),
                      borderRadius: '8px',
                      marginBottom: '8px',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}
                  />
                  <div style={{ fontSize: '12px' }}>{key}</div>
                  <div style={{ fontSize: '10px', opacity: 0.6 }}>{getColor(key)}</div>
                </div>
              ))}
            </div>
          </ThemedCard>
          
          <ThemedCard title="Buttons">
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <ThemedButton variant="primary">Primary Button</ThemedButton>
              <ThemedButton variant="secondary">Secondary Button</ThemedButton>
              <ThemedButton onClick={toggleLightDark}>Toggle Theme</ThemedButton>
            </div>
          </ThemedCard>
          
          <ThemedCard title="Input Field">
            <ThemedInput
              label="Email Address"
              placeholder="Enter your email"
            />
          </ThemedCard>
        </div>
      </div>
    </div>
  );
}
