import React from 'react';
import { Container, CircularProgress, Grid, Paper, Typography } from '@material-ui/core';
import PriceChart from '../components/PriceChart'
import {get} from '../utils/Api'
import { withStyles } from '@material-ui/core/styles';

const styles = {

}

class Position extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
        g_height: 0 ,
        g_width: 0 ,
        position: undefined,
        price_df: undefined,
    };
    this.graphRef = React.createRef();
  }

  componentDidMount(){
    window.addEventListener("resize", this.updateGraph);
    var pos_id = this.props.location.search.split('=')[1]
    if (pos_id !== null){
        this.retrieve_position_details(pos_id)
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateGraph);
  }
 
  componentDidUpdate() {
    if (this.state.g_height === 0){
      this.updateGraph();
    } 
  }

  updateGraph = () => {
    if (this.graphRef.current !== null){
      if (this.state.g_height !== this.graphRef.current.clientHeight) {
        this.setState({g_height: this.graphRef.current.clientHeight})
      }
      if (this.state.g_width !== this.graphRef.current.clientWidth) {
        this.setState({g_width: this.graphRef.current.clientWidth})
      }
    }
  }

  retrieve_position_details = (pos_id) => {
    get('api/position_details/?id='+ pos_id).then((resp) => {
        if (resp.status === 200){
          var response = JSON.parse(resp.response)
          console.log(response)
          this.setState({
              position: response.position,
              price_df: response.price_df,
          })
        }
      })
  }

  line_chart_data = () => {
    var data = []
    if (this.state.price_df !== undefined){
        for (let i = 0; i < this.state.price_df.date.length; i++) {
            const close = this.state.price_df.close[i].toFixed(2)
            const high_sma = this.state.price_df.high_sma[i].toFixed(2)
            const low_sma = this.state.price_df.low_sma[i].toFixed(2)
            const name = this.state.price_df.date[i].split('T')[0]
            const item = {'name': name, 'close': close, [`high_sma - ${this.state.position.sma_position === undefined ? 'None' : this.state.position.sma_position.model.high_sma}`]: high_sma, [`low_sma - ${this.state.position.sma_position === undefined ? 'None' : this.state.position.sma_position.model.low_sma}`]:low_sma }
            data.push(item)
      }
    }
    return data
  }

    price_max = () => {
        console.log('min_max')
        var max = 0
        if (this.state.price_df !== undefined){
            var arr = [this.state.price_df.close, this.state.price_df.high_sma, this.state.price_df.low_sma].flat()
            max = Math.max.apply(null, arr)
        }
        return Math.round(max)
    }

    price_min = () => {
        console.log('min_max')
        var min = 0
        if (this.state.price_df !== undefined){
            var arr = [this.state.price_df.close, this.state.price_df.high_sma, this.state.price_df.low_sma].flat()
            min = Math.min.apply(null, arr)
        }
        return Math.round(min)
    }


  render() {
    if(this.state.position === undefined){
        return(
            <Grid container
            spacing={0}
            direction="column"
            alignItems="center"
            justify="center"
            style={{ minHeight: '100vh' }}> <CircularProgress color='primary' /></Grid>
        )
    } else {
        return (
            <Container>
              <Grid container direction="column" spacing={1}>
                <Grid item container xs={12} sm={12} direction="column" alignItems="center" justify="center">
                    <Typography variant='h4'>
                        {this.state.position.stock.symbol} | {this.state.position.stock.name}
                    </Typography>
                    <Typography variant='h6'>
                        {this.state.position.open_date !== null && new Date(this.state.position.open_date).toLocaleString({formatMatcher:'basic'})} - {this.state.position.sell_order[0].sma_position !== null && new Date(this.state.position.close_date).toLocaleString({timeZoneName:'short'})}
                    </Typography>
                </Grid>
                <Grid item container xs={12} sm={12} direction="row" justify="center" spacing={1}>
                    <Grid item container xs={12} sm={4} >
                        <Paper style={{flexGrow: 1, padding:5}}>
                            <Grid item container direction="row" alignItems="center" justify="center">
                                <Typography variant='body1' style={{fontWeight:'bold'}}>
                                    Buy order
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    price_date
                                </Typography>
                                <Typography variant='body2'>
                                    {this.state.position.buy_order.length !== 0 && this.state.position.buy_order[0].sma_position.price_date}
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    created_at
                                </Typography>
                                <Typography variant='body2'>
                                    {this.state.position.buy_order.length !== 0 &&  new Date(this.state.position.buy_order[0].created_at).toLocaleString({formatMatcher:'basic'})}
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    submited_at
                                </Typography>
                                <Typography variant='body2'>
                                    {this.state.position.buy_order.length !== 0 &&  new Date(this.state.position.buy_order[0].submited_at).toLocaleString({formatMatcher:'basic'})}
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    executed_at
                                </Typography>
                                <Typography variant='body2'>
                                    {this.state.position.buy_order.length !== 0 &&  new Date(this.state.position.buy_order[0].executed_at).toLocaleString({formatMatcher:'basic'})}
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    order_rate
                                </Typography>
                                <Typography variant='body2'>
                                    {this.state.position.buy_order.length !== 0 &&  this.state.position.buy_order[0].order_rate.toFixed(2)}
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    num_of_shares
                                </Typography>
                                <Typography variant='body2'>
                                    {this.state.position.buy_order.length !== 0 && this.state.position.buy_order[0].num_of_shares}
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    total_investment
                                </Typography>
                                <Typography variant='body2'>
                                    {this.state.position.buy_order.length !== 0 && this.state.position.buy_order[0].total_investment.toFixed(2)}
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    stop_loss
                                </Typography>
                                <Typography variant='body2'>
                                    {this.state.position.buy_order.length !== 0 && this.state.position.buy_order[0].stop_loss.toFixed(2)}
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    take_profit
                                </Typography>
                                <Typography variant='body2'>
                                    {this.state.position.buy_order.length !== 0 && this.state.position.buy_order[0].take_profit.toFixed(2)}
                                </Typography>
                            </Grid>
                        </Paper>
                    </Grid>
                    <Grid item container xs={12} sm={4} >
                        <Paper style={{flexGrow: 1, padding:5}}>
                            <Grid item container direction="row" alignItems="center" justify="center">
                                <Typography variant='body1' style={{fontWeight:'bold'}}>
                                    Model
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    SMAs
                                </Typography>
                                <Typography variant='body2'>
                                    {this.state.position.sma_position !== undefined && this.state.position.sma_position.model.low_sma} | {this.state.position.sma_position !== undefined && this.state.position.sma_position.model.high_sma} 
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    cagr
                                </Typography>
                                <Typography variant='body2'>
                                    {this.state.position.sma_position !== undefined && (this.state.position.sma_position.sma_backtest.model_cagr*100).toFixed(1)}%
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    precision
                                </Typography>
                                <Typography variant='body2'>
                                    {this.state.position.sma_position !== undefined && (this.state.position.sma_position.sma_backtest.precision*100).toFixed(1)}%
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    score
                                </Typography>
                                <Typography variant='body2'>
                                    {this.state.position.sma_position !== undefined && this.state.position.sma_position.sma_backtest.score.toFixed(2)}
                                </Typography>
                            </Grid>
                        </Paper>
                    </Grid>
                    <Grid item container xs={12} sm={4} >
                        <Paper style={{flexGrow: 1, padding:5}}>
                            <Grid item container direction="row" alignItems="center" justify="center">
                                <Typography variant='body1' style={{fontWeight:'bold'}}>
                                    Sell order
                                </Typography>
                            </Grid>
                            {this.state.position.sell_order.length !== 0 &&
                            <React.Fragment>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    price_date
                                </Typography>
                                <Typography variant='body2'>
                                    {this.state.position.sell_order[0].sma_position !== null && this.state.position.sell_order[0].sma_position.price_date}
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    created_at
                                </Typography>
                                <Typography variant='body2'>
                                    {new Date(this.state.position.sell_order[0].created_at).toLocaleString({formatMatcher:'basic'})}
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    executed_at
                                </Typography>
                                <Typography variant='body2'>
                                    {this.state.position.sell_order[0].executed_at === null ? 'None' : new Date(this.state.position.sell_order[0].executed_at).toLocaleString({formatMatcher:'basic'})}
                                </Typography>
                            </Grid>
                            </React.Fragment>
                            }
                        </Paper>
                    </Grid>
                </Grid>
                <Grid item container xs={12} sm={12} >
                    <Paper style={{flexGrow: 1, height: '600px'}} ref={this.graphRef} >
                        <PriceChart 
                            data={this.line_chart_data()}
                            max={this.price_max()}
                            min={this.price_min()}
                            open_date={this.state.position.open_date}
                            close_date={this.state.position.close_date}
                            high_sma_val={this.state.position.sma_position === undefined ? null : this.state.position.sma_position.model.high_sma}
                            low_sma_val={this.state.position.sma_position === undefined ? null : this.state.position.sma_position.model.low_sma}
                            height={this.state.g_height}
                            width={this.state.g_width}
                            />
                    </Paper>
                </Grid>
              </Grid>
            </Container>
          ); 
    }
  }
}
export default withStyles(styles, { withTheme: true })(Position);