# PastelFrame

PastelFrame is a React component that allows users to enhance their images with customizable pastel frames, borders, and effects.

## Features

- Upload and display images
- Customize background color with solid colors and pastel gradients
- Adjust border thickness with interactive resizers
- Toggle padding and drop shadow effects
- Dark mode support
- Download enhanced images
- Copy enhanced images to clipboard

## Installation

1. Clone this repository or copy the `PastelFrame.js` file into your React project.
2. Ensure you have the necessary dependencies installed:

```bash
npm install react
```

## Usage

Import the PastelFrame component into your React application:

```jsx
import PastelFrame from './path/to/PastelFrame';

function App() {
  return (
    <div className="App">
      <PastelFrame />
    </div>
  );
}

export default App;
```

## How to Use

1. Click on the "Choose an image or drag it here" area to upload an image.
2. Use the color palette to select a background color or gradient.
3. Drag the circular handles on the edges of the frame to adjust border thickness.
4. Toggle the "Add Padding" and "Add Drop Shadow" checkboxes to apply those effects.
5. Click the "Download" button to save your enhanced image.
6. Click the "Copy" button to copy the image to your clipboard.
7. Use the dark mode toggle in the top-right corner to switch between light and dark themes.

## Customization

You can easily customize the PastelFrame component by modifying the `pastelColors` array to include your preferred colors and gradients.

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to check [issues page](https://github.com/yourusername/pastelframe/issues) if you want to contribute.

## License

This project is [MIT](https://choosealicense.com/licenses/mit/) licensed.