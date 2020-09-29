import React from 'react';
import { TextField, Grid, Button, Divider, Typography, Switch, Select, MenuItem } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';


const styles = {

}

class Profile extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
      }

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value});
    }

    render() {
        return (
        <Grid
            container
            direction='column'
            alignItems='center'
        >   
            <Grid container item xs={10} sm={4} md={4} lg={4} xl={4} style={{margin:10}}>
                <TextField
                    onChange={e => {this.handleChange(e);}}
                    defaultValue={this.props.user.username}
                    name="username"
                    variant="outlined"
                    fullWidth
                    required
                    id="Name"
                    label="Name"
                    error={this.props.errors.username !== undefined}
                    helperText={this.props.errors.username}
                />
            </Grid>
            <Grid container item xs={10} sm={4} md={4} lg={4} xl={4} style={{margin:10}}>
                <TextField
                    onChange={e => {this.handleChange(e);}}
                    defaultValue={this.props.user.email}
                    name="email"
                    variant="outlined"
                    fullWidth
                    required
                    id="Email"
                    label="Email"
                    error={this.props.errors.email !== undefined}
                    helperText={this.props.errors.email}
                />
            </Grid>
            <Grid container item xs={10} sm={4} md={4} lg={4} xl={4} style={{margin:10}}>
                <TextField
                    onChange={e => {this.handleChange(e);}}
                    defaultValue=''
                    variant="outlined"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    error={this.props.errors.password !== undefined}
                    helperText={this.props.errors.password}
                />
            </Grid>
            <Grid container item xs={10} sm={4} md={4} lg={4} xl={4} style={{margin:10}}>
                <TextField
                    onChange={e => {this.handleChange(e);}}
                    defaultValue={this.props.user.broker_username}
                    variant="outlined"
                    required
                    fullWidth
                    name="broker_username"
                    label="Broker username"
                    type="broker_username"
                    id="broker_username"
                    error={this.props.errors.broker_username !== undefined}
                    helperText={this.props.errors.broker_username}
                />
            </Grid>
            <Grid container item xs={10} sm={4} md={4} lg={4} xl={4} style={{margin:10}}>
                <TextField
                    onChange={e => {this.handleChange(e);}}
                    defaultValue={this.props.user.broker_password}
                    variant="outlined"
                    required
                    fullWidth
                    name="broker_password"
                    label="Broker password"
                    type="password"
                    id="broker_password"
                    error={this.props.errors.broker_password !== undefined}
                    helperText={this.props.errors.broker_password}
                />
            </Grid>
            {this.props.p_demo.portfolio.created_at !== null && 
            <Grid container item direction="column" align='center' justify='center'  xs={10} sm={4} md={4} lg={4} xl={4} style={{margin:10}}>
                <Typography variant='body1'>
                    Demo account
                </Typography>
                <Grid container alignItems='center' justify='space-between' item style={{marginVertical:5}} >
                    <Typography variant='body1'>
                        {this.props.p_demo.portfolio.active ? 'Active' : 'Inactive'}
                    </Typography>
                    <Switch
                        name='demo_active'
                        checked={this.props.p_demo.portfolio.active === true}
                        onChange={() => {this.props.update_portfolio({'active': this.props.p_demo.portfolio.active === true ? 'False' : 'True', 'portfolio_type': 'False'})}}
                    />
                </Grid>
                <Grid container alignItems='center' justify='space-between' item style={{marginVertical:5}}>
                    <Typography variant='body1'>
                        Neural network
                    </Typography>
                    <Typography variant='body1'>
                        {this.props.p_demo.portfolio.neural_network.nn_name}
                    </Typography>
                </Grid>
                <Grid container alignItems='center' justify='space-between' item style={{marginVertical:5}}>
                    <Typography variant='body1'>
                        Stop loss
                    </Typography>
                    <Select
                        labelId="stop_loss_select_demo"
                        id="stop_loss_select_demo"
                        value={this.props.p_demo.portfolio.stop_loss === null ? 'None' : this.props.p_demo.portfolio.stop_loss}
                        onChange={(event) => {this.props.update_portfolio({'stop_loss': event.target.value === 'None' ? null : event.target.value, 'portfolio_type': 'False'})}}
                    >   
                        <MenuItem value={'None'}>None</MenuItem>
                        <MenuItem value={0.01}>1%</MenuItem>
                        <MenuItem value={0.025}>2,5%</MenuItem>
                        <MenuItem value={0.05}>5%</MenuItem>
                        <MenuItem value={0.10}>10%</MenuItem>
                        <MenuItem value={0.15}>15%</MenuItem>
                        <MenuItem value={0.20}>20%</MenuItem>
                    </Select>
                </Grid>
                <Grid container alignItems='center' justify='space-between' item style={{marginVertical:5}}>
                    <Typography variant='body1'>
                        Take profit
                    </Typography>
                    <Select
                        labelId="take_profit_select_demo"
                        id="take_profit_select_demo"
                        value={this.props.p_demo.portfolio.take_profit === null ? 'None' : this.props.p_demo.portfolio.take_profit}
                        onChange={(event) => {this.props.update_portfolio({'take_profit': event.target.value === 'None' ? null : event.target.value, 'portfolio_type': 'False'})}}
                    >   
                        <MenuItem value={'None'}>None</MenuItem>
                        <MenuItem value={0.10}>10%</MenuItem>
                        <MenuItem value={0.15}>15%</MenuItem>
                        <MenuItem value={0.20}>20%</MenuItem>
                        <MenuItem value={0.30}>30%</MenuItem>
                        <MenuItem value={0.40}>40%</MenuItem>
                        <MenuItem value={0.50}>50%</MenuItem>
                        <MenuItem value={1}>100%</MenuItem>
                    </Select>
                </Grid>
                <Grid container alignItems='center' justify='space-between' item style={{marginVertical:5}}>
                    <Typography variant='body1'>
                        Position size (% of total asset)
                    </Typography>
                    <Select
                        labelId="pos_size_select_demo"
                        id="pos_size_select_demo"
                        value={this.props.p_demo.portfolio.pos_size === null ? 'None' : this.props.p_demo.portfolio.pos_size}
                        onChange={(event) => {this.props.update_portfolio({'pos_size':  event.target.value, 'portfolio_type': 'False'})}}
                    >   
                        <MenuItem value={0.01}>1%</MenuItem>
                        <MenuItem value={0.05}>5%</MenuItem>
                        <MenuItem value={0.10}>10%</MenuItem>
                        <MenuItem value={0.15}>15%</MenuItem>
                        <MenuItem value={0.20}>20%</MenuItem>
                        <MenuItem value={0.30}>30%</MenuItem>
                    </Select>
                </Grid>
            </Grid>
            }
            <Grid container item direction="column" align='center' justify='center'  xs={10} sm={4} md={4} lg={4} xl={4} style={{margin:10}}>
                <Divider style={{margin: 10}}/>
            </Grid>
            {this.props.p_real.portfolio.created_at !== null && 
            <Grid container item direction="column" align='center' justify='center'  xs={10} sm={4} md={4} lg={4} xl={4} style={{margin:10}}>
                <Typography variant='body1'>
                    Real account
                </Typography>
                <Grid container alignItems='center' justify='space-between' item style={{marginVertical:5}} >
                    <Typography variant='body1'>
                        {this.props.p_real.portfolio.active ? 'Active' : 'Inactive'}
                    </Typography>
                    <Switch
                        name='demo_active'
                        checked={this.props.p_real.portfolio.active === true}
                        onChange={() => {this.props.update_portfolio({'active': this.props.p_real.portfolio.active === true ? 'False' : 'True', 'portfolio_type': 'True'})}}
                    />
                </Grid>
                <Grid container alignItems='center' justify='space-between' item style={{marginVertical:5}}>
                    <Typography variant='body1'>
                        Neural network
                    </Typography>
                    <Typography variant='body1'>
                        {this.props.p_real.portfolio.neural_network.nn_name}
                    </Typography>
                </Grid>
                <Grid container alignItems='center' justify='space-between' item style={{marginVertical:5}}>
                    <Typography variant='body1'>
                        Stop loss
                    </Typography>
                    <Select
                        labelId="stop_loss_select_demo"
                        id="stop_loss_select_demo"
                        value={this.props.p_real.portfolio.stop_loss === null ? 'None' : this.props.p_real.portfolio.stop_loss}
                        onChange={(event) => {this.props.update_portfolio({'stop_loss': event.target.value === 'None' ? null : event.target.value, 'portfolio_type': 'True'})}}
                    >
                        <MenuItem value={'None'}>None</MenuItem>
                        <MenuItem value={0.01}>1%</MenuItem>
                        <MenuItem value={0.025}>2,5%</MenuItem>
                        <MenuItem value={0.05}>5%</MenuItem>
                        <MenuItem value={0.10}>10%</MenuItem>
                        <MenuItem value={0.15}>15%</MenuItem>
                        <MenuItem value={0.20}>20%</MenuItem>
                    </Select>
                </Grid>
                <Grid container alignItems='center' justify='space-between' item style={{marginVertical:5}}>
                    <Typography variant='body1'>
                        Take profit
                    </Typography>
                    <Select
                        labelId="take_profit_select_demo"
                        id="take_profit_select_demo"
                        value={this.props.p_real.portfolio.take_profit === null ? 'None' : this.props.p_real.portfolio.take_profit}
                        onChange={(event) => {this.props.update_portfolio({'take_profit': event.target.value === 'None' ? null : event.target.value, 'portfolio_type': 'True'})}}
                    >   
                        <MenuItem value={'None'}>None</MenuItem>
                        <MenuItem value={0.10}>10%</MenuItem>
                        <MenuItem value={0.15}>15%</MenuItem>
                        <MenuItem value={0.20}>20%</MenuItem>
                        <MenuItem value={0.30}>30%</MenuItem>
                        <MenuItem value={0.40}>40%</MenuItem>
                        <MenuItem value={0.50}>50%</MenuItem>
                        <MenuItem value={1}>100%</MenuItem>
                    </Select>
                </Grid>
                <Grid container alignItems='center' justify='space-between' item style={{marginVertical:5}}>
                    <Typography variant='body1'>
                        Position size (% of total asset)
                    </Typography>
                    <Select
                        labelId="pos_size_select_demo"
                        id="pos_size_select_demo"
                        value={this.props.p_real.portfolio.pos_size === null ? 'None' : this.props.p_real.portfolio.pos_size}
                        onChange={(event) => {this.props.update_portfolio({'pos_size':  event.target.value, 'portfolio_type': 'False'})}}
                    >   
                        <MenuItem value={0.01}>1%</MenuItem>
                        <MenuItem value={0.05}>5%</MenuItem>
                        <MenuItem value={0.10}>10%</MenuItem>
                        <MenuItem value={0.15}>15%</MenuItem>
                        <MenuItem value={0.20}>20%</MenuItem>
                        <MenuItem value={0.30}>30%</MenuItem>
                    </Select>
                </Grid>
            </Grid>
            }
            <Grid item xs={10} style={{margin:10}}>
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => {this.props.update_user(this.state)}}
                >
                Update account
                </Button>
                <Divider style={{margin: 10}}/>
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    onClick={() => {this.props.logout()}}
                >
                    Logout
                </Button>
            </Grid>
        </Grid>
    ); 
  }
}

export default withStyles(styles, { withTheme: true })(Profile);