import React from 'react';
import { Container } from '@material-ui/core';

class _404 extends React.Component {
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
      <div>
          _404
      </div>
    ); 
  }
}

export default _404