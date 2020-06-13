import React from 'react';
import { Container, TextField, Grid, Button, Paper, Typography, List, ListItem, ListItemText, ListSubheader } from '@material-ui/core';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import {post, verify_token, refresh_token} from '../utils/Api'

function ListItemLink(props) {
    return <ListItem button component="a" {...props} />;
}

class Model extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
        selected_model: {},
        selected_model_pk: null,
        name: '',
        initial_balance: 10000,
        look_back: 10,
        low_sma: 5,
        high_sma: 34,
        max_single_pos: 0.1,
        trading_interval: 1,
        sma_diff: 0,
        sma_slope: 0,
        start_date: '2010-01-04',
        end_date: '2019-12-31'
    };
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }

  submit = async () => {
      post('api/tradingmodel/', this.state).then((resp) => {
        console.log(resp)
      })
  }
  

  model_form = () =>{
      return(
        <Grid
        container
        spacing={2}
        direction="column"
        alignItems="center"
        justify="center"
    >
        <Grid item xs={12}>
            <TextField
                onChange={e => {this.handleChange(e);}}
                name="name"
                variant="outlined"
                fullWidth
                required
                id="Name"
                label="Name"
            />
        </Grid>
        <Grid item xs={12}>
            <TextField
                onChange={e => {this.handleChange(e);}}
                defaultValue={this.state.initial_balance}
                name="initial_balance"
                variant="outlined"
                fullWidth
                id="initial_balance"
                label="Initial balance"
            />
        </Grid>
        <Grid item xs={12}>
            <TextField
                onChange={e => {this.handleChange(e);}}
                defaultValue={this.state.look_back}
                name="look_back"
                variant="outlined"
                fullWidth
                id="look_back"
                label="Look back"
            />
        </Grid>
        <Grid item xs={12}>
            <TextField
                onChange={e => {this.handleChange(e);}}
                defaultValue={this.state.low_sma}
                name="low_sma"
                variant="outlined"
                fullWidth
                id="low_sma"
                label="Low SMA"
            />
        </Grid>
        <Grid item xs={12}>
            <TextField
                onChange={e => {this.handleChange(e);}}
                defaultValue={this.state.high_sma}
                name="high_sma"
                variant="outlined"
                fullWidth
                id="high_sma"
                label="High SMA"
            />
        </Grid>
        <Grid item xs={12}>
            <TextField
                onChange={e => {this.handleChange(e);}}
                defaultValue={this.state.max_single_pos}
                name="max_single_pos"
                variant="outlined"
                fullWidth
                id="max_single_pos"
                label="Max single position"
            />
        </Grid>
        <Grid item xs={12}>
            <TextField
                onChange={e => {this.handleChange(e);}}
                defaultValue={this.state.trading_interval}
                name="trading_interval"
                variant="outlined"
                fullWidth
                id="trading_interval"
                label="Trading interval"
            />
        </Grid>
        <Grid item xs={12}>
            <TextField
                onChange={e => {this.handleChange(e);}}
                defaultValue={this.state.sma_diff}
                name="sma_diff"
                variant="outlined"
                fullWidth
                id="sma_diff"
                label="SMAs delta"
            />
        </Grid>
        <Grid item xs={12}>
            <TextField
                onChange={e => {this.handleChange(e);}}
                defaultValue={this.state.sma_slope}
                name="sma_slope"
                variant="outlined"
                fullWidth
                id="sma_slope"
                label="SMAs delta slope"
            />
        </Grid>
        <Grid item xs={12}>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <KeyboardDatePicker
                    disableToolbar
                    variant="inline"
                    format="yyyy-MM-dd"
                    margin="normal"
                    name='start_date'
                    label='Start date'
                    value={this.state.start_date}
                    onChange={e => {this.handleChange(e);}}
                    KeyboardButtonProps={{'aria-label': 'change date'}}
                />
            </MuiPickersUtilsProvider>
            <Grid item xs={12}>
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                    <KeyboardDatePicker
                        disableToolbar
                        variant="inline"
                        format="yyyy-MM-dd"
                        margin="normal"
                        name='start_date'
                        label='End date'
                        value={this.state.end_date}
                        onChange={e => {this.handleChange(e);}}
                        KeyboardButtonProps={{'aria-label': 'change date'}}
                    />
                </MuiPickersUtilsProvider>
            </Grid>
        </Grid>


        <Grid item xs={12}>
        <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => {this.submit()}}
        >
            Create model
        </Button>
        </Grid>
    </Grid>
    )
  }

  handleSelect(pk){
      for (const key in this.props.user.models) {
          if(this.props.user.models[key].pk === pk){
            console.log(this.props.user.models[key])
            this.setState({selected_model: this.props.user.models[key], selected_model_pk:this.props.user.models[key].pk})
            break
          }
      }
  }

  backtest = async () => {
    post('api/backtest/', this.state.selected_model).then((resp) => {
        console.log(resp)
    })
  }

  render() {
    return (
        <Grid container style={{minHeight:'calc(100vh - 84px)'}}>
            <Grid item xs={4} alignItems="center" style={{maxHeight: 'calc(100vh - 84px)', overflow:'auto'}}>
                <List>
                    {this.props.user.models.map((model) => (
                        <ListItem button key={model.pk} selected={this.state.selected_model_pk === model.pk} onClick={() => {this.handleSelect(model.pk)}} >
                            <ListItemText primary={model.name} secondary={model.created_at} />
                        </ListItem>
                    ))}
                </List>
            </Grid>
            <Grid container item xs={4} style={{justifyContent:'center'}}>
                <List>
                    <ListItem >
                        <Typography variant='h4'>
                            {this.state.selected_model.name}
                        </Typography>
                    </ListItem>
                    <ListItem >
                        <Typography>
                            Date: {this.state.selected_model.created_at}
                        </Typography>
                    </ListItem>
                    <ListItem >
                        <Typography>
                            Initial balance: {this.state.selected_model.initial_balance}
                        </Typography>
                    </ListItem>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={() => {this.backtest()}}
                    >
                        Backtest model
                    </Button>
                </List>

            </Grid>
            <Grid item xs={4}>
                {this.model_form()}
            </Grid>
        </Grid>
    )
  }
}

export default Model

{/* <Grid container spacing={5} direction="row" justify='center' alignContent='center' >
<Grid item style={{ backgroundColor: 'red' }}>
    {this.model_form()}
</Grid>
<Grid item style={{backgroundColor: 'yellow' }}>
    <Paper style={{maxHeight: '100vh', overflow: 'auto'}}>
        <List>
        {this.props.user.models.map((model) => (
            <ListItemLink key={model.pk} href='/model' >
                <ListItemText primary={model.name} secondary={model.created_at} />
            </ListItemLink>
        ))}
        </List>
    </Paper>
</Grid> */}
