import React from 'react';
import { Container } from '@material-ui/core';

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 

    };
  }

  componentDidMount(){
      console.log(this.props)
  }

  componentDidUpdate(){
    console.log(this.props)
}

  render() {
    return (
      <Container>
          Home
      </Container>
    ); 
  }
}

export default Home