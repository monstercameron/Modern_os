/**
 * Theme showcase demo page
 * Demonstrates all themed components in action
 */

import React from 'react';
import { useTheme, themedBg, themedText } from './ThemeContext';
import {
  ThemedButton,
  ThemedCard,
  ThemedIndicator,
  ThemedInput
} from './components/ThemedComponents';

/**
 * Complete themed component showcase page
 */
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
