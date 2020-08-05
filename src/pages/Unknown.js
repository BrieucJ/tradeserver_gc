import React from 'react';
import { Typography, Grid } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

const styles = {

}

class Unknown extends React.Component {

    render() {
    const { theme } = this.props;
    return (
        <Grid
            container
            direction='column'
            alignItems='center'
        >   
            <Typography variant='h1' style={{color:this.props.theme.palette.type === 'dark' ? this.props.theme.palette.common.white : this.props.theme.palette.common.black}}>
                404
            </Typography>
        </Grid>
    ); 
  }
}

export default withStyles(styles, { withTheme: true })(Unknown);