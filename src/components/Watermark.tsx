import React from 'react';

export const Watermark: React.FC = () => {
  return (
    <>
      <div className="chaibytes-bg-pattern" />
      
      {/* Absolute faint floating text overlays */}
      <div className="chaibytes-code-watermark" style={{ top: '10%', left: '5%' }}>
        {`const brew = () => {\n  const chai = new CardamomChai();\n  return chai.steep();\n};`}
      </div>
      
      <div className="chaibytes-code-watermark" style={{ top: '35%', right: '8%' }}>
        {`{ \n  status: "midnight-brew",\n  ideas: "overflowing",\n  code: "clean"\n}`}
      </div>

      <div className="chaibytes-code-watermark" style={{ bottom: '25%', left: '15%' }}>
        {`<Chaibytes>\n  <Idea />\n  <Product />\n</Chaibytes>`}
      </div>

      <div className="chaibytes-code-watermark" style={{ bottom: '8%', right: '12%' }}>
        {`deploy({\n  project: "chaibytes-os",\n  latency: "1.2ms",\n  status: "healthy"\n});`}
      </div>
    </>
  );
};
