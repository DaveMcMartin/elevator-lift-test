# Elevator Lift Test

[Português](./readme.pt-BR.md)

This app measures velocity, acceleration, jerk, and ambient noise of an elevator while it is moving.
It uses the device's accelerometer and microphone to collect and analyze data in real-time.

![home](./docs/home-en-us.png)

## How It Works

The app calculates the following metrics using the device's sensors:

1.  **Acceleration**: The app isolates the **vertical acceleration** (movement along the direction of gravity). It works by:
    * Determining the precise direction of gravity by comparing the raw acceleration data with the total acceleration (which includes gravity's pull).
    * Projecting the device's linear acceleration onto this calculated direction of gravity. This filters out horizontal motion and isolates the true vertical acceleration of the elevator.
    * A small deadband is applied to the final value to prevent sensor noise from causing drift when the elevator is stationary.

    The vertical acceleration ($a_{\text{vert}}$) is conceptually calculated as the dot product of the linear acceleration vector ($\vec{a}_{\text{lin}}$) and the normalized gravity vector ($\hat{g}$).

    ```math
    a_{\text{vert}} = \vec{a}_{\text{lin}} \cdot \hat{g}
    ```

2.  **Velocity**: This represents the **vertical velocity**, which is calculated by numerically integrating the vertical acceleration over the time interval between measurements.

    ```math
    v = v_{\text{prev}} + a_{\text{vert}} \cdot \Delta t
    ```

    Where:
    - `$v_{\text{prev}}$` is the velocity from the previous measurement.
    - `$a_{\text{vert}}$` is the current vertical acceleration.
    - `$\Delta t$` is the elapsed time since the last measurement.

3.  **Jerk**: This is the rate of change of **vertical acceleration**, which quantifies the smoothness of the elevator's motion.

    ```math
    j = \frac{a_{\text{vert}} - a_{\text{vert, prev}}}{\Delta t}
    ```

    Where:
    - `$a_{\text{vert, prev}}$` is the vertical acceleration from the previous measurement.

4.  **Ambient Noise**: Measures the volume of ambient sound inside the elevator using the device's microphone. The measurement is provided in **decibels relative to full scale (dBFS)**, which indicates the amplitude of the audio signal compared to the maximum possible level the device can handle.

## University Project

This app was developed as part of a university project at **Estácio de Sá**, Brazil.

## License

Licensed under **GPLv3**.

## Contact

- **Name**: David Martins dos Anjos
- **Email**: [contato@davidmartins.net](mailto:contato@davidmartins.net)
