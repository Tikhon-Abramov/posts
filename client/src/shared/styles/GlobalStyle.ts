import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    background: #080A12;
  }

  body {
    margin: 0;
    min-width: 320px;
    min-height: 100vh;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background:
      radial-gradient(circle at top left, rgba(124, 58, 237, 0.2), transparent 32%),
      radial-gradient(circle at top right, rgba(37, 99, 235, 0.16), transparent 34%),
      radial-gradient(circle at bottom, rgba(239, 68, 68, 0.1), transparent 34%),
      #080A12;
    color: #F5F7FB;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
  }

  button {
    cursor: pointer;
  }

  img,
  video {
    display: block;
    max-width: 100%;
  }
`;
