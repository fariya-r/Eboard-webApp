// // src/components/TextBoxManager.js

// export class TextBoxManager {
//   constructor(setTextBoxes, getTextBoxes) {
//     this.setTextBoxes = setTextBoxes;
//     this.getTextBoxes = getTextBoxes;
//   }

//   getTextBoxSize(text, font = 'Arial', fontSize = 16, maxWidth = 300) {
//     const canvas = document.createElement('canvas');
//     const context = canvas.getContext('2d');
//     context.font = `${fontSize}px ${font}`;
  
//     const words = text.split(' ');
//     let line = '';
//     let lines = [];
  
//     for (let i = 0; i < words.length; i++) {
//       const testLine = line + words[i] + ' ';
//       const { width: testWidth } = context.measureText(testLine);
//       if (testWidth > maxWidth && i > 0) {
//         lines.push(line);
//         line = words[i] + ' ';
//       } else {
//         line = testLine;
//       }
//     }
//     lines.push(line);
  
//     const height = lines.length * (fontSize + 6); // Adjust for line height
//     return {
//       width: maxWidth,
//       height,
//       lines,
//     };
//   }
  

//   handle(text) {
//     console.log("📦 TextBoxManager: handling extracted text:", text.substring(0, 100) + '...');
  
//     const textBoxes = this.getTextBoxes();
//     const font = 'Arial';
//     const fontSize = 16;
//     const color = '#000000';
  
//     const { width, height } = this.getTextBoxSize(text, font, fontSize);
  
//     const newTextBox = {
//       x: 200,
//       y: 200 + textBoxes.length * (height + 20), // auto-vertical stacking
//       text,
//       font,
//       size: fontSize,
//       color,
//       bold: false,
//       italic: false,
//       underline: false,
//       width,
//       height,
//       draggable: true,
//       resizable: true, // if supported by renderer
//     };
  
//     this.setTextBoxes([...textBoxes, newTextBox]);
//   }
  
// }
