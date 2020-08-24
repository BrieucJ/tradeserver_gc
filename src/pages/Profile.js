import React from 'react';
import { TextField, Grid, Button, Divider, Typography, Switch } from '@material-ui/core';
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
            <Grid container alignItems='center' justify='space-between' item xs={10} sm={4} md={4} lg={4} xl={4} style={{margin:5}}>
                <Typography variant='body1'>
                    Demo account
                </Typography>
                <Switch
                    name='demo_live'
                    checked={this.props.user.demo_live === 'True'}
                    onChange={() => {this.props.update_user({'demo_live': this.props.user.demo_live === 'True' ? 'False' : 'True'})}}
                    name="portfolio_type"
                />
            </Grid>
            <Grid container alignItems='center' justify='space-between' item xs={10} sm={4} md={4} lg={4} xl={4} style={{margin:5}}>
                <Typography variant='body1'>
                    Real account
                </Typography>
                <Switch
                    name='real_live'
                    checked={this.props.user.real_live === 'True'}
                    onChange={() => {this.props.update_user({'real_live': this.props.user.real_live === 'True' ? 'False' : 'True'})}}
                    name="portfolio_type"
                />
            </Grid>
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

export default Profile