import React from 'react';
import { HelpCircle } from 'lucide-react';

export function HelperBanner({ title, description, tip, nextAction }) {
  return (
    <div className="helper-banner">
      <div className="icon-box">
        <HelpCircle size={20} />
      </div>
      <div>
        <h4>{title}</h4>
        <p>{description}</p>
        {(tip || nextAction) && (
          <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#3730a3', fontWeight: 500 }}>
            {tip && <span>💡 <strong>Tip:</strong> {tip} </span>}
            {nextAction && <span>👉 <strong>Suggested Action:</strong> {nextAction}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default HelperBanner;
