import { red } from '@material-ui/core/colors';
import { createMuiTheme } from '@material-ui/core/styles';

// A custom theme for this app
export const dark_theme = createMuiTheme({
  palette: {
    type: 'dark',
  },
});


export const light_theme = createMuiTheme({
    palette: {
      type: 'light',
      background: {
        default: '#F1F1F1',
        },
    },
});