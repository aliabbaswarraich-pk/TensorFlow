export interface SampleItem {
  id: string;
  name: string;
  expectedClass: string;
  description: string;
  render: (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => void;
}

export const SAMPLE_ITEMS: SampleItem[] = [
  {
    id: 'sock',
    name: 'ATHLETIC WOVEN SOCK',
    expectedClass: 'SOCK',
    description: 'Knitted cotton athletic sock with ribbed collar and reinforced heel/toe.',
    render: (ctx, width, height, time) => {
      ctx.save();
      ctx.translate(width / 2, height / 2 + Math.sin(time) * 10);
      ctx.rotate(Math.sin(time * 0.7) * 0.08);

      // Shadow
      ctx.shadowColor = 'rgba(147, 51, 234, 0.35)';
      ctx.shadowBlur = 35;

      // Sock Main Leg Tube
      ctx.fillStyle = '#E8E5DF';
      ctx.beginPath();
      ctx.roundRect(-45, -130, 90, 140, [10, 10, 0, 0]);
      ctx.fill();

      // Ribbed Ankle Texture
      ctx.fillStyle = '#7C3AED';
      ctx.fillRect(-45, -125, 90, 10);
      ctx.fillRect(-45, -105, 90, 10);

      // Foot and Heel
      ctx.fillStyle = '#E8E5DF';
      ctx.beginPath();
      ctx.moveTo(-45, 10);
      ctx.quadraticCurveTo(-60, 65, -15, 80); // heel curve
      ctx.lineTo(95, 80); // bottom sole
      ctx.quadraticCurveTo(130, 75, 130, 35); // toe cap curve
      ctx.quadraticCurveTo(125, 5, 45, 10); // top bridge
      ctx.closePath();
      ctx.fill();

      // Purple Reinforced Heel
      ctx.fillStyle = '#7C3AED';
      ctx.beginPath();
      ctx.arc(-25, 50, 30, 0, Math.PI);
      ctx.fill();

      // Purple Reinforced Toe Cap
      ctx.beginPath();
      ctx.arc(105, 45, 25, -Math.PI / 2, Math.PI / 2);
      ctx.fill();

      ctx.restore();
    },
  },
  {
    id: 'shoe',
    name: 'RUNNING SNEAKER',
    expectedClass: 'RUNNING SHOE',
    description: 'Athletic performance trainer with cushioned outsole.',
    render: (ctx, width, height, time) => {
      ctx.save();
      ctx.translate(width / 2, height / 2 + Math.sin(time) * 10);
      ctx.rotate(Math.sin(time * 0.7) * 0.06);

      ctx.shadowColor = 'rgba(236, 72, 153, 0.35)';
      ctx.shadowBlur = 35;

      // Sneaker Upper Body
      ctx.fillStyle = '#EDE8E1';
      ctx.beginPath();
      ctx.moveTo(-120, 25);
      ctx.quadraticCurveTo(-130, -35, -55, -45); // heel rise
      ctx.lineTo(25, -15); // tongue
      ctx.quadraticCurveTo(120, 5, 125, 35); // toe
      ctx.lineTo(-120, 35);
      ctx.closePath();
      ctx.fill();

      // Sneaker Swoosh Accent
      ctx.strokeStyle = '#9333EA';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-70, 0);
      ctx.quadraticCurveTo(0, 15, 60, -10);
      ctx.stroke();

      // Thick Sole
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(-128, 32, 260, 26, 6);
      ctx.fill();

      // Outsole Tread Line
      ctx.fillStyle = '#9333EA';
      ctx.fillRect(-128, 52, 260, 6);

      ctx.restore();
    },
  },
  {
    id: 'cup',
    name: 'CERAMIC COFFEE MUG',
    expectedClass: 'COFFEE MUG',
    description: 'Glazed porcelain mug with ergonomic circular handle.',
    render: (ctx, width, height, time) => {
      ctx.save();
      ctx.translate(width / 2, height / 2 + Math.sin(time) * 10);

      ctx.shadowColor = 'rgba(255, 255, 255, 0.25)';
      ctx.shadowBlur = 35;

      // Mug Body
      ctx.fillStyle = '#F5F3EF';
      ctx.beginPath();
      ctx.roundRect(-55, -70, 110, 140, 12);
      ctx.fill();

      // Accent Band
      ctx.fillStyle = '#9333EA';
      ctx.fillRect(-55, -40, 110, 16);

      // Handle
      ctx.strokeStyle = '#F5F3EF';
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(65, 0, 36, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      ctx.restore();
    },
  },
  {
    id: 'phone',
    name: 'SMARTPHONE DEVICE',
    expectedClass: 'CELLULAR TELEPHONE',
    description: 'Bezel-less slate glass handset.',
    render: (ctx, width, height, time) => {
      ctx.save();
      ctx.translate(width / 2, height / 2 + Math.sin(time) * 8);

      ctx.shadowColor = 'rgba(168, 85, 247, 0.35)';
      ctx.shadowBlur = 35;

      // Phone Body
      ctx.fillStyle = '#181524';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-55, -110, 110, 220, 18);
      ctx.fill();
      ctx.stroke();

      // Glowing Screen
      const screenGrad = ctx.createLinearGradient(-48, -98, 48, 98);
      screenGrad.addColorStop(0, '#581c87');
      screenGrad.addColorStop(1, '#0f0e17');
      ctx.fillStyle = screenGrad;
      ctx.beginPath();
      ctx.roundRect(-48, -98, 96, 196, 12);
      ctx.fill();

      // Camera Island Notch
      ctx.fillStyle = '#08070d';
      ctx.beginPath();
      ctx.roundRect(-16, -92, 32, 10, 5);
      ctx.fill();

      ctx.restore();
    },
  },
];
