import React from 'react';
import { Grid, Button } from '@material-ui/core';
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

  componentDidMount(){
    
  }

  componentDidUpdate(){
    console.log(this.props)
  }

update_trade_history = async () => {
  get('api/update_trade_history/').then((resp) => {
    if (resp.status === 200){
      var response = JSON.parse(resp.response)
      console.log(response)
      // this.setState({
      //   demo_portfolio: response.p_demo.portfolio,
      //   demo_positions: response.p_demo.positions,
      //   pending_orders_demo: response.p_demo.pending_orders,
      //   real_portfolio: response.p_real.portfolio,
      //   real_positions: response.p_real.positions,
      //   pending_orders_real: response.p_real.pending_orders
      // })
    }
  })
}

  render() {
    const { classes, theme } = this.props;
    return (
      <Grid>
          Home
          <Button
            color="primary" 
            size={theme.breakpoints.down("md") ? 'small' : 'medium'}
            type="submit"
            variant="contained"
            onClick={() => {this.update_trade_history()}}
          >
            Update trade history
          </Button>
      </Grid>
    ); 
  }
}

export default withStyles(styles, { withTheme: true })(Home);