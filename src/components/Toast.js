import React from 'react';
import Alert from '@material-ui/lab/Alert';
import { withStyles } from '@material-ui/core/styles';

const styles = {

}

class Toast extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
        active_index: 0
    };
  } 

  componentDidMount(){
      console.log('Toast')
      console.log(this.props)
  }


  render() {
    const { classes, theme, portfolio} = this.props;
    return (
        <Alert variant="filled" severity={this.props.type} style={{position:'absolute', bottom: 10, left:10, minWidth:100, opacity: this.props.opacity}}>
            {this.props.message}
        </Alert>
    ); 
  }
}

export default withStyles(styles, { withTheme: true })(Toast);