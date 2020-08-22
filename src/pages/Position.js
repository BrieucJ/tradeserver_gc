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
    console.log('line_chart_data')
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
                        {new Date(this.state.position.open_date).toLocaleString({formatMatcher:'basic'})} - {this.state.position.close_date === null ? 'None' : new Date(this.state.position.close_date).toLocaleString({timeZoneName:'short'})}
                    </Typography>
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