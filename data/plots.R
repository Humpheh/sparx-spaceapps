library(ggplot2)
theme_set(theme_minimal())
library(readr)

climate = read_csv("climate.csv")
ggplot(climate, aes(x = month_num, y = temperature)) +
  stat_smooth(se = FALSE) +
  scale_x_continuous(
    breaks = climate$month_num,
    labels = climate$month_name,
    minor_breaks = NULL
  ) +
  scale_y_continuous(
    breaks = c(0, -5, -10, -15, -20, -25),
    minor_breaks = seq(3, -30)
  ) +
  labs(x = "Month", y = "Temperature (°C)") +
  geom_hline(yintercept = 0, size = 2, alpha = 0.2) +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))
ggsave("temps.png", width = 5, height = 3)

ggplot(climate, aes(x = month_num, y = wind_speed)) +
  stat_smooth(se = FALSE) +
  scale_x_continuous(
    breaks = climate$month_num,
    labels = climate$month_name,
    minor_breaks = NULL
  ) +
  scale_y_continuous(
    breaks = c(0, 5, 10, 15, 20, 25),
    minor_breaks = seq(0, 30)
  ) +
  labs(x = "Month", y = "Wind speed (km/h)") +
  geom_hline(yintercept = 0, size = 2, alpha = 0.2) +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))
ggsave("winds.png", width = 5, height = 3)