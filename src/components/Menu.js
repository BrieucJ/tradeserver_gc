import React from 'react';
import {AppBar, Container, Toolbar, Link, Typography, IconButton, Hidden, SwipeableDrawer, Box, List, ListItem, ListItemText, Switch} from '@material-ui/core/';
import {AccountCircle} from '@material-ui/icons';
import Brightness7Icon from '@material-ui/icons/Brightness7';
import Brightness4Icon from '@material-ui/icons/Brightness4';
import MenuIcon from '@material-ui/icons/Menu';
import { withStyles } from '@material-ui/core/styles';

const styles = {
  drawer_list: {
    width: 250,
  },
  appBar_list: {
    display: 'flex',
    flexDirection: 'row',
    padding: 0,
  }
};

class Menu extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      drawer_open: false
    };
  }

  toggle_drawer = () => {
    this.setState({drawer_open: !this.state.drawer_open})
  }

  drawer = () => {
    return(
      <SwipeableDrawer
        anchor='left'
        open={this.state.drawer_open}
        onClose={() => {this.toggle_drawer()}}
        onOpen={() => {this.toggle_drawer()}}
      >
        <Typography >
          <Link href="/" style={{'padding': 10}}>Home</Link>
          <Link href="/portfolio" style={{'padding': 10}}>Portfolio</Link>
          <Link href="/market" style={{'padding': 10}}>Market</Link>
          <Link href="/model" style={{'padding': 10}}>Model</Link>
        </Typography>
      </SwipeableDrawer>
    )
  }

  render() {
    const { classes, theme } = this.props;
    return (
        <AppBar position="static" style={{marginBottom:20}}>
          <Container>
            <Toolbar style={{justifyContent: 'space-between'}}>
              <Hidden lgUp>
                <IconButton edge="start" aria-label="menu" onClick={() => {this.toggle_drawer()}}>
                  <MenuIcon />
                </IconButton>
              </Hidden>
              <Hidden mdDown>
              <List className={classes.appBar_list}>
                <ListItem button component="a" key={'home'} href="/">
                  <ListItemText primary={'Home'} />
                </ListItem>
                <ListItem button component="a" key={'order'} href="/order">
                  <ListItemText primary={'Orders'} />
                </ListItem>
                <ListItem button component="a" key={'history'} href="/history">
                  <ListItemText primary={'History'} />
                </ListItem>
                <ListItem button component="a" key={'market'} href="/market">
                  <ListItemText primary={'Market'} />
                </ListItem>
              </List>
              </Hidden>
              <Box>
              <Switch
                checked={this.props.portfolio_type}
                onChange={() => {this.props.handlePortfolioChange()}}
                name="portfolio_type"
              />
                <IconButton onClick={() => {this.props.handleThemeChange()}}>
                  {theme.palette.type === 'dark' ? <Brightness7Icon  /> : <Brightness4Icon />}
                </IconButton>
                <IconButton href="/profile">
                  <AccountCircle />
                </IconButton>
              </Box>
            </Toolbar>
            <SwipeableDrawer
              anchor='left'
              open={this.state.drawer_open}
              onClose={() => {this.toggle_drawer()}}
              onOpen={() => {this.toggle_drawer()}}
            >
              <List className={classes.drawer_list}>
                <ListItem button component="a" key={'home'} href="/">
                  <ListItemText primary={'Home'} />
                </ListItem>
                <ListItem button component="a" key={'orders'} href="/order">
                  <ListItemText primary={'Orders'} />
                </ListItem>
                <ListItem button component="a" key={'history'} href="/history">
                  <ListItemText primary={'History'} />
                </ListItem>
                <ListItem button component="a" key={'market'} href="/market">
                  <ListItemText primary={'Market'} />
                </ListItem>
              </List>
            </SwipeableDrawer>
            </Container>
        </AppBar>
    ); 
  }
}

export default withStyles(styles, { withTheme: true })(Menu);