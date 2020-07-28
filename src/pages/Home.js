import React from 'react';
import { Container, Grid } from '@material-ui/core';
import {get} from '../utils/Api'
import { withStyles } from '@material-ui/core/styles';

const styles = {

}

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 

    };
  }


  render() {
    const { classes, theme } = this.props;
    return (
      <Container>
        <Grid container direction="column" alignItems="center" justify="center">

        </Grid>
      </Container>
    ); 
  }
}

export default withStyles(styles, { withTheme: true })(Home);