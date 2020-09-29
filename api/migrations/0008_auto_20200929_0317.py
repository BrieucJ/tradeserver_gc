# Generated by Django 3.0.7 on 2020-09-29 03:17

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_auto_20200928_2217'),
    ]

    operations = [
        migrations.AlterField(
            model_name='portfolio',
            name='neural_network',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='portfolio', to='api.NeuralNetwork'),
        ),
    ]