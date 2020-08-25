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
        order: undefined,
        price_df: undefined,
    };
    this.graphRef = React.createRef();
  }

  componentDidMount(){
    window.addEventListener("resize", this.updateGraph);
    var order_id = this.props.location.search.split('=')[1]
    if (order_id !== null){
        this.retrieve_order_details(order_id)
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

  retrieve_order_details = (order_id) => {
    get('api/buy_order_details/?id='+ order_id).then((resp) => {
        if (resp.status === 200){
          var response = JSON.parse(resp.response)
          console.log(response)
          this.setState({
              order: response.buy_order,
              price_df: response.price_df,
          })
        }
      })
  }

  line_chart_data = () => {
    console.log('line_chart_data')
    var data = []
    if (this.state.price_df !== undefined){
        for (let i = 0; i < this.state.price_df.date.length; i++) {
            const close = this.state.price_df.close[i].toFixed(2)
            const high_sma = this.state.price_df.high_sma[i].toFixed(2)
            const low_sma = this.state.price_df.low_sma[i].toFixed(2)
            const name = this.state.price_df.date[i].split('T')[0]
            const item = {'name': name, 'close': close, [`high_sma - ${this.state.order.sma_position === undefined ? 'None' : this.state.order.sma_position.model.high_sma}`]: high_sma, [`low_sma - ${this.state.order.sma_position === undefined ? 'None' : this.state.order.sma_position.model.low_sma}`]:low_sma }
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
    if(this.state.order === undefined){
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
                        {this.state.order.stock.symbol} | {this.state.order.stock.name}
                    </Typography>
                    <Typography variant='h6'>
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
                                  {this.state.order.sma_position.price_date}
                              </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                              <Typography variant='body2'>
                                  created_at
                              </Typography>
                              <Typography variant='body2'>
                                  {this.state.order.created_at === null ? 'None' : new Date(this.state.order.created_at).toLocaleString({formatMatcher:'basic'})}
                              </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                              <Typography variant='body2'>
                                  submited_at
                              </Typography>
                              <Typography variant='body2'>
                                  {this.state.order.submited_at === null ? 'None' : new Date(this.state.order.submited_at).toLocaleString({formatMatcher:'basic'})}
                              </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                              <Typography variant='body2'>
                                  executed_at
                              </Typography>
                              <Typography variant='body2'>
                                  {this.state.order.executed_at === null ? 'None' : new Date(this.state.order.executed_at).toLocaleString({formatMatcher:'basic'})}
                              </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                              <Typography variant='body2'>
                                  canceled_at
                              </Typography>
                              <Typography variant='body2'>
                                  {this.state.order.canceled_at === null ? 'None' : new Date(this.state.order.canceled_at).toLocaleString({formatMatcher:'basic'})}
                              </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                              <Typography variant='body2'>
                                  terminated_at
                              </Typography>
                              <Typography variant='body2'>
                                  {this.state.order.terminated_at === null ? 'None' : new Date(this.state.order.terminated_at).toLocaleString({formatMatcher:'basic'})}
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
                                    price_date
                                </Typography>
                                <Typography variant='body2'>  
                                    {this.state.order.sma_position !== undefined && this.state.order.sma_position.price_date}
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    SMAs
                                </Typography>
                                <Typography variant='body2'>
                                    {this.state.order.sma_position !== undefined && this.state.order.sma_position.model.low_sma} | {this.state.order.sma_position !== undefined && this.state.order.sma_position.model.high_sma} 
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    low_sma value
                                </Typography>
                                <Typography variant='body2'>  
                                    {this.state.order.sma_position !== undefined && this.state.order.sma_position.low_sma.toFixed(2)}
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    high_sma value
                                </Typography>
                                <Typography variant='body2'>  
                                    {this.state.order.sma_position !== undefined && this.state.order.sma_position.high_sma.toFixed(2)}
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    cagr
                                </Typography>
                                <Typography variant='body2'>
                                    {this.state.order.sma_position !== undefined && (this.state.order.sma_position.sma_backtest.model_cagr*100).toFixed(1)}%
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    precision
                                </Typography>
                                <Typography variant='body2'>
                                    {this.state.order.sma_position !== undefined && (this.state.order.sma_position.sma_backtest.precision*100).toFixed(1)}%
                                </Typography>
                            </Grid>
                            <Grid item container direction="row" alignItems="center" justify="space-between">
                                <Typography variant='body2'>
                                    score
                                </Typography>
                                <Typography variant='body2'>
                                    {this.state.order.sma_position !== undefined && this.state.order.sma_position.sma_backtest.score.toFixed(2)}
                                </Typography>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
                <Grid item container xs={12} sm={12} >
                    <Paper style={{flexGrow: 1, height: '600px'}} ref={this.graphRef} >
                        <PriceChart 
                            data={this.line_chart_data()}
                            max={this.price_max()}
                            min={this.price_min()}
                            open_date={this.state.order.sma_position.price_date}
                            close_date={null}
                            high_sma_val={this.state.order.sma_position === undefined ? null : this.state.order.sma_position.model.high_sma}
                            low_sma_val={this.state.order.sma_position === undefined ? null : this.state.order.sma_position.model.low_sma}
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