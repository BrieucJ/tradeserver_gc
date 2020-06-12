import React from 'react';
import {AppBar, Toolbar, Link, Typography, Button, Box, Container} from '@material-ui/core/';
import {AccountCircle} from '@material-ui/icons';

class Menu extends React.Component {
  render() {
    return (
        <AppBar position="static" style={{marginBottom:20}}>
            <Toolbar style={{'justifyContent': 'space-around'}}>
                <Typography>
                    <Link href="/" color="inherit">Home</Link>
                    <Link href="/portfolio" color="inherit" style={{'padding': 10}}>Portfolio</Link>
                    <Link href="/model" color="inherit">Model</Link>
                </Typography>
                <Box style={{'display':'flex', 'alignItems': 'center', 'justifyContent':'center'}}>
                  <Button color="inherit" href="/profile">
                    <AccountCircle />
                  </Button>
                  <Button color="inherit" onClick={() => {this.props.logout()}}>Logout</Button>
                </Box>
            </Toolbar>
        </AppBar>
    ); 
  }
}

export default Menu