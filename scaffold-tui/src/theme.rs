use ratatui::style::Color;

#[derive(Debug, Clone)]
pub struct Theme {
    pub name: &'static str,
    pub bg: Color,
    pub text: Color,
    pub primary: Color,
    pub secondary: Color,
    pub accent: Color,
}

impl Theme {
    pub fn cmd() -> Self {
        Self {
            name: "cmd",
            bg: Color::Rgb(0, 0, 0),
            text: Color::Rgb(204, 204, 204),
            primary: Color::Rgb(255, 255, 255),
            secondary: Color::Rgb(128, 128, 128),
            accent: Color::Rgb(0, 255, 0),
        }
    }

    pub fn default_theme() -> Self {
        Self {
            name: "default",
            bg: Color::Rgb(10, 15, 30),
            text: Color::Rgb(248, 250, 252),
            primary: Color::Rgb(243, 210, 12),    // #f3d20c
            secondary: Color::Rgb(100, 116, 139), // Muted Slate Gray
            accent: Color::Rgb(12, 45, 243),      // #0c2df3
        }
    }

    pub fn earth() -> Self {
        Self {
            name: "earth",
            bg: Color::Rgb(25, 20, 15),
            text: Color::Rgb(248, 250, 252),
            primary: Color::Rgb(123, 167, 88),   // #7ba758
            secondary: Color::Rgb(167, 132, 88), // #a78458
            accent: Color::Rgb(162, 167, 88),    // #a2a758
        }
    }

    pub fn knicks_in_5() -> Self {
        Self {
            name: "knicksin5",
            bg: Color::Rgb(0, 107, 182),          // Blue
            text: Color::Rgb(255, 255, 255),      // White
            primary: Color::Rgb(245, 132, 38),    // Orange
            secondary: Color::Rgb(190, 192, 194), // Silver
            accent: Color::Rgb(245, 132, 38),     // Orange
        }
    }

    pub fn lime() -> Self {
        Self {
            name: "lime",
            bg: Color::Rgb(15, 30, 15),
            text: Color::Rgb(248, 250, 252),
            primary: Color::Rgb(40, 215, 47),    // #28d72f
            secondary: Color::Rgb(120, 215, 40), // #78d728
            accent: Color::Rgb(208, 215, 40),    // #d0d728
        }
    }

    pub fn los_doyers_1() -> Self {
        Self {
            name: "losdoyers1",
            bg: Color::Rgb(0, 90, 156),           // Dodger Blue
            text: Color::Rgb(255, 255, 255),      // White
            primary: Color::Rgb(239, 62, 66),     // Red
            secondary: Color::Rgb(165, 172, 175), // Silver
            accent: Color::Rgb(239, 62, 66),      // Red
        }
    }

    pub fn los_doyers_2() -> Self {
        Self {
            name: "losdoyers2",
            bg: Color::Rgb(255, 255, 255),     // White
            text: Color::Rgb(0, 90, 156),      // Dodger Blue
            primary: Color::Rgb(239, 62, 66),  // Red
            secondary: Color::Rgb(0, 90, 156), // Dodger Blue
            accent: Color::Rgb(165, 172, 175), // Silver
        }
    }

    pub fn los_doyers_3() -> Self {
        Self {
            name: "losdoyers3",
            bg: Color::Rgb(0, 90, 156),           // Dodger Blue
            text: Color::Rgb(255, 255, 255),      // White
            primary: Color::Rgb(165, 172, 175),   // Silver
            secondary: Color::Rgb(255, 255, 255), // White
            accent: Color::Rgb(165, 172, 175),    // Silver
        }
    }

    pub fn ocean() -> Self {
        Self {
            name: "ocean",
            bg: Color::Rgb(10, 25, 30),
            text: Color::Rgb(248, 250, 252),
            primary: Color::Rgb(70, 185, 160),   // #46b9a0
            secondary: Color::Rgb(70, 152, 185), // #4698b9
            accent: Color::Rgb(70, 185, 103),    // #46b967
        }
    }

    pub fn osx() -> Self {
        Self {
            name: "osx",
            bg: Color::Rgb(255, 255, 255),
            text: Color::Rgb(0, 0, 0),
            primary: Color::Rgb(0, 122, 255),
            secondary: Color::Rgb(142, 142, 147),
            accent: Color::Rgb(52, 199, 89),
        }
    }

    pub fn plum() -> Self {
        Self {
            name: "plum",
            bg: Color::Rgb(10, 15, 30),
            text: Color::Rgb(248, 250, 252),
            primary: Color::Rgb(59, 170, 196),   // #3baac4
            secondary: Color::Rgb(59, 102, 196), // #3b66c4
            accent: Color::Rgb(85, 59, 196),     // #553bc4
        }
    }

    pub fn posh() -> Self {
        Self {
            name: "posh",
            bg: Color::Rgb(1, 36, 86),
            text: Color::Rgb(238, 237, 240),
            primary: Color::Rgb(249, 241, 165),
            secondary: Color::Rgb(0, 128, 255),
            accent: Color::Rgb(255, 128, 0),
        }
    }

    pub fn starburst() -> Self {
        Self {
            name: "starburst",
            bg: Color::Rgb(15, 15, 10),
            text: Color::Rgb(248, 250, 252),
            primary: Color::Rgb(172, 247, 8),  // #acf708
            secondary: Color::Rgb(52, 247, 8), // #34f708
            accent: Color::Rgb(247, 203, 8),   // #f7cb08
        }
    }

    pub fn tifosi() -> Self {
        Self {
            name: "tifosi",
            bg: Color::Rgb(239, 26, 45),       // Rosso Corsa Red
            text: Color::Rgb(255, 255, 255),   // White
            primary: Color::Rgb(255, 242, 0),  // Scudetto Yellow
            secondary: Color::Rgb(0, 0, 0),    // Black
            accent: Color::Rgb(255, 255, 255), // White
        }
    }

    pub fn ubu() -> Self {
        Self {
            name: "ubu",
            bg: Color::Rgb(48, 10, 36),
            text: Color::Rgb(255, 255, 255),
            primary: Color::Rgb(233, 84, 32),
            secondary: Color::Rgb(119, 33, 111),
            accent: Color::Rgb(44, 0, 30),
        }
    }

    pub fn usa_1() -> Self {
        Self {
            name: "usa1",
            bg: Color::Rgb(179, 25, 66),          // Red
            text: Color::Rgb(255, 255, 255),      // White
            primary: Color::Rgb(10, 49, 97),      // Blue
            secondary: Color::Rgb(255, 255, 255), // White
            accent: Color::Rgb(10, 49, 97),       // Blue
        }
    }

    pub fn usa_2() -> Self {
        Self {
            name: "usa2",
            bg: Color::Rgb(255, 255, 255),     // White
            text: Color::Rgb(10, 49, 97),      // Blue
            primary: Color::Rgb(179, 25, 66),  // Red
            secondary: Color::Rgb(10, 49, 97), // Blue
            accent: Color::Rgb(179, 25, 66),   // Red
        }
    }

    pub fn usa_3() -> Self {
        Self {
            name: "usa3",
            bg: Color::Rgb(10, 49, 97),           // Blue
            text: Color::Rgb(255, 255, 255),      // White
            primary: Color::Rgb(179, 25, 66),     // Red
            secondary: Color::Rgb(255, 255, 255), // White
            accent: Color::Rgb(179, 25, 66),      // Red
        }
    }

    pub fn usa_4() -> Self {
        Self {
            name: "usa4",
            bg: Color::Rgb(10, 49, 97),         // Blue
            text: Color::Rgb(255, 255, 255),    // White
            primary: Color::Rgb(255, 255, 255), // White
            secondary: Color::Rgb(179, 25, 66), // Red
            accent: Color::Rgb(179, 25, 66),    // Red
        }
    }

    pub fn who_dat() -> Self {
        Self {
            name: "whodat",
            bg: Color::Rgb(0, 0, 0),              // Pure Black
            text: Color::Rgb(255, 255, 255),      // White
            primary: Color::Rgb(211, 188, 141),   // Gold
            secondary: Color::Rgb(255, 255, 255), // White
            accent: Color::Rgb(211, 188, 141),    // Gold
        }
    }

    pub fn bumble() -> Self {
        Self {
            name: "bumble",
            bg: Color::Rgb(0, 0, 0),           // Black
            text: Color::Rgb(255, 255, 255),   // White
            primary: Color::Rgb(255, 235, 0),  // Yellow
            secondary: Color::Rgb(40, 40, 40), // Dark Gray
            accent: Color::Rgb(255, 235, 0),   // Yellow
        }
    }

    pub fn amigo_1() -> Self {
        Self {
            name: "amigo1",
            bg: Color::Rgb(0, 104, 71),           // Mexican Green
            text: Color::Rgb(255, 255, 255),      // White
            primary: Color::Rgb(206, 17, 38),     // Mexican Red
            secondary: Color::Rgb(255, 255, 255), // White
            accent: Color::Rgb(206, 17, 38),      // Red
        }
    }

    pub fn amigo_2() -> Self {
        Self {
            name: "amigo2",
            bg: Color::Rgb(206, 17, 38),          // Mexican Red
            text: Color::Rgb(255, 255, 255),      // White
            primary: Color::Rgb(0, 104, 71),      // Mexican Green
            secondary: Color::Rgb(255, 255, 255), // White
            accent: Color::Rgb(0, 104, 71),       // Green
        }
    }

    pub fn amigo_3() -> Self {
        Self {
            name: "amigo3",
            bg: Color::Rgb(255, 255, 255),     // White
            text: Color::Rgb(0, 104, 71),      // Green
            primary: Color::Rgb(206, 17, 38),  // Red
            secondary: Color::Rgb(0, 104, 71), // Green
            accent: Color::Rgb(206, 17, 38),   // Red
        }
    }

    pub fn amigo_4() -> Self {
        Self {
            name: "amigo4",
            bg: Color::Rgb(255, 255, 255),      // White
            text: Color::Rgb(206, 17, 38),      // Red
            primary: Color::Rgb(0, 104, 71),    // Green
            secondary: Color::Rgb(206, 17, 38), // Red
            accent: Color::Rgb(0, 104, 71),     // Green
        }
    }

    pub fn bollywood_1() -> Self {
        Self {
            name: "bollywood1",
            bg: Color::Rgb(255, 153, 51),         // Saffron
            text: Color::Rgb(255, 255, 255),      // White
            primary: Color::Rgb(19, 136, 8),      // India Green
            secondary: Color::Rgb(255, 255, 255), // White
            accent: Color::Rgb(19, 136, 8),       // Green
        }
    }

    pub fn bollywood_2() -> Self {
        Self {
            name: "bollywood2",
            bg: Color::Rgb(19, 136, 8),           // India Green
            text: Color::Rgb(255, 255, 255),      // White
            primary: Color::Rgb(255, 153, 51),    // Saffron
            secondary: Color::Rgb(255, 255, 255), // White
            accent: Color::Rgb(255, 153, 51),     // Saffron
        }
    }

    pub fn get_by_index(idx: usize) -> Self {
        match idx % 27 {
            0 => Self::cmd(),
            1 => Self::default_theme(),
            2 => Self::earth(),
            3 => Self::knicks_in_5(),
            4 => Self::lime(),
            5 => Self::los_doyers_1(),
            6 => Self::los_doyers_2(),
            7 => Self::los_doyers_3(),
            8 => Self::ocean(),
            9 => Self::osx(),
            10 => Self::plum(),
            11 => Self::posh(),
            12 => Self::starburst(),
            13 => Self::tifosi(),
            14 => Self::ubu(),
            15 => Self::usa_1(),
            16 => Self::usa_2(),
            17 => Self::usa_3(),
            18 => Self::usa_4(),
            19 => Self::who_dat(),
            20 => Self::bumble(),
            21 => Self::amigo_1(),
            22 => Self::amigo_2(),
            23 => Self::amigo_3(),
            24 => Self::amigo_4(),
            25 => Self::bollywood_1(),
            26 => Self::bollywood_2(),
            _ => Self::default_theme(),
        }
    }
}
