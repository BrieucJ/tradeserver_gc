import React from 'react';
import { Container, Button } from '@material-ui/core';
import {get} from '../utils/Api'


class Portfolio extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 

    };
  }

  get_portfolio = async () => {
    get('api/update_portfolio/').then((resp) => {
        console.log(resp)
    })
  }

  render() {
    return (
      <Container>
          Portfolio
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => {this.get_portfolio()}}
          >
            Get portfolio
          </Button>
      </Container>
    ); 
  }
}

export default Portfolio