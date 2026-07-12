use ratatui::style::Color;

#[derive(Debug, Clone)]
pub struct Theme {
    pub name: String,
    pub bg: Color,
    pub text: Color,
    pub primary: Color,
    pub secondary: Color,
    pub accent: Color,
}

impl Theme {
    pub fn hex_to_color(hex: &str) -> Option<Color> {
        let hex = hex.trim_start_matches('#');
        if hex.len() != 6 {
            return None;
        }
        let r = u8::from_str_radix(&hex[0..2], 16).ok()?;
        let g = u8::from_str_radix(&hex[2..4], 16).ok()?;
        let b = u8::from_str_radix(&hex[4..6], 16).ok()?;
        Some(Color::Rgb(r, g, b))
    }

    pub fn color_to_hex(color: &Color) -> String {
        if let Color::Rgb(r, g, b) = color {
            format!("#{:02X}{:02X}{:02X}", r, g, b)
        } else {
            "#FFFFFF".to_string()
        }
    }

    pub fn color_distance(c1: &Color, c2: &Color) -> f32 {
        if let (Color::Rgb(r1, g1, b1), Color::Rgb(r2, g2, b2)) = (c1, c2) {
            let dr = *r1 as f32 - *r2 as f32;
            let dg = *g1 as f32 - *g2 as f32;
            let db = *b1 as f32 - *b2 as f32;
            (dr * dr + dg * dg + db * db).sqrt()
        } else {
            0.0
        }
    }

    pub fn auto_derive_secondary(primary: &Color) -> Color {
        if let Color::Rgb(r, g, b) = primary {
            let r2 = (*r as f32 * 0.5) as u8;
            let g2 = (*g as f32 * 0.5) as u8;
            let b2 = (*b as f32 * 0.5) as u8;
            Color::Rgb(r2, g2, b2)
        } else {
            Color::Rgb(128, 128, 128)
        }
    }

    pub fn auto_derive_accent(primary: &Color) -> Color {
        if let Color::Rgb(r, g, b) = primary {
            let r2 = (*r as f32 * 1.5).min(255.0) as u8;
            let g2 = (*g as f32 * 1.5).min(255.0) as u8;
            let b2 = (*b as f32 * 1.5).min(255.0) as u8;
            Color::Rgb(r2, g2, b2)
        } else {
            Color::Rgb(255, 255, 255)
        }
    }

    pub fn cmd() -> Self {
        Self {
            name: "cmd".to_string(),
            bg: Color::Rgb(0, 0, 0),
            text: Color::Rgb(204, 204, 204),
            primary: Color::Rgb(255, 255, 255),
            secondary: Color::Rgb(128, 128, 128),
            accent: Color::Rgb(0, 255, 0),
        }
    }

    pub fn default_theme() -> Self {
        Self {
            name: "default".to_string(),
            bg: Color::Rgb(10, 15, 30),
            text: Color::Rgb(248, 250, 252),
            primary: Color::Rgb(243, 210, 12),    // #f3d20c
            secondary: Color::Rgb(100, 116, 139), // Muted Slate Gray
            accent: Color::Rgb(12, 45, 243),      // #0c2df3
        }
    }

    pub fn earth() -> Self {
        Self {
            name: "earth".to_string(),
            bg: Color::Rgb(25, 20, 15),
            text: Color::Rgb(248, 250, 252),
            primary: Color::Rgb(123, 167, 88),   // #7ba758
            secondary: Color::Rgb(167, 132, 88), // #a78458
            accent: Color::Rgb(162, 167, 88),    // #a2a758
        }
    }

    pub fn knicks_in_5() -> Self {
        Self {
            name: "knicksin5".to_string(),
            bg: Color::Rgb(0, 107, 182),          // Blue
            text: Color::Rgb(255, 255, 255),      // White
            primary: Color::Rgb(245, 132, 38),    // Orange
            secondary: Color::Rgb(190, 192, 194), // Silver
            accent: Color::Rgb(245, 132, 38),     // Orange
        }
    }

    pub fn lime() -> Self {
        Self {
            name: "lime".to_string(),
            bg: Color::Rgb(15, 30, 15),
            text: Color::Rgb(248, 250, 252),
            primary: Color::Rgb(40, 215, 47),    // #28d72f
            secondary: Color::Rgb(120, 215, 40), // #78d728
            accent: Color::Rgb(208, 215, 40),    // #d0d728
        }
    }

    pub fn los_doyers_1() -> Self {
        Self {
            name: "losdoyers1".to_string(),
            bg: Color::Rgb(0, 90, 156),           // Dodger Blue
            text: Color::Rgb(255, 255, 255),      // White
            primary: Color::Rgb(239, 62, 66),     // Red
            secondary: Color::Rgb(165, 172, 175), // Silver
            accent: Color::Rgb(239, 62, 66),      // Red
        }
    }

    pub fn los_doyers_2() -> Self {
        Self {
            name: "losdoyers2".to_string(),
            bg: Color::Rgb(255, 255, 255),     // White
            text: Color::Rgb(0, 90, 156),      // Dodger Blue
            primary: Color::Rgb(239, 62, 66),  // Red
            secondary: Color::Rgb(0, 90, 156), // Dodger Blue
            accent: Color::Rgb(165, 172, 175), // Silver
        }
    }

    pub fn los_doyers_3() -> Self {
        Self {
            name: "losdoyers3".to_string(),
            bg: Color::Rgb(0, 90, 156),           // Dodger Blue
            text: Color::Rgb(255, 255, 255),      // White
            primary: Color::Rgb(165, 172, 175),   // Silver
            secondary: Color::Rgb(255, 255, 255), // White
            accent: Color::Rgb(165, 172, 175),    // Silver
        }
    }

    pub fn ocean() -> Self {
        Self {
            name: "ocean".to_string(),
            bg: Color::Rgb(10, 25, 30),
            text: Color::Rgb(248, 250, 252),
            primary: Color::Rgb(70, 185, 160),   // #46b9a0
            secondary: Color::Rgb(70, 152, 185), // #4698b9
            accent: Color::Rgb(70, 185, 103),    // #46b967
        }
    }

    pub fn osx() -> Self {
        Self {
            name: "osx".to_string(),
            bg: Color::Rgb(255, 255, 255),
            text: Color::Rgb(0, 0, 0),
            primary: Color::Rgb(0, 122, 255),
            secondary: Color::Rgb(142, 142, 147),
            accent: Color::Rgb(52, 199, 89),
        }
    }

    pub fn plum() -> Self {
        Self {
            name: "plum".to_string(),
            bg: Color::Rgb(10, 15, 30),
            text: Color::Rgb(248, 250, 252),
            primary: Color::Rgb(59, 170, 196),   // #3baac4
            secondary: Color::Rgb(59, 102, 196), // #3b66c4
            accent: Color::Rgb(85, 59, 196),     // #553bc4
        }
    }

    pub fn posh() -> Self {
        Self {
            name: "posh".to_string(),
            bg: Color::Rgb(1, 36, 86),
            text: Color::Rgb(238, 237, 240),
            primary: Color::Rgb(249, 241, 165),
            secondary: Color::Rgb(0, 128, 255),
            accent: Color::Rgb(255, 128, 0),
        }
    }

    pub fn starburst() -> Self {
        Self {
            name: "starburst".to_string(),
            bg: Color::Rgb(15, 15, 10),
            text: Color::Rgb(248, 250, 252),
            primary: Color::Rgb(172, 247, 8),  // #acf708
            secondary: Color::Rgb(52, 247, 8), // #34f708
            accent: Color::Rgb(247, 203, 8),   // #f7cb08
        }
    }

    pub fn tifosi() -> Self {
        Self {
            name: "tifosi".to_string(),
            bg: Color::Rgb(239, 26, 45),       // Rosso Corsa Red
            text: Color::Rgb(255, 255, 255),   // White
            primary: Color::Rgb(255, 242, 0),  // Scudetto Yellow
            secondary: Color::Rgb(0, 0, 0),    // Black
            accent: Color::Rgb(255, 255, 255), // White
        }
    }

    pub fn ubu() -> Self {
        Self {
            name: "ubu".to_string(),
            bg: Color::Rgb(48, 10, 36),
            text: Color::Rgb(255, 255, 255),
            primary: Color::Rgb(233, 84, 32),
            secondary: Color::Rgb(119, 33, 111),
            accent: Color::Rgb(44, 0, 30),
        }
    }

    pub fn usa_1() -> Self {
        Self {
            name: "usa1".to_string(),
            bg: Color::Rgb(179, 25, 66),          // Red
            text: Color::Rgb(255, 255, 255),      // White
            primary: Color::Rgb(10, 49, 97),      // Blue
            secondary: Color::Rgb(255, 255, 255), // White
            accent: Color::Rgb(10, 49, 97),       // Blue
        }
    }

    pub fn usa_2() -> Self {
        Self {
            name: "usa2".to_string(),
            bg: Color::Rgb(255, 255, 255),     // White
            text: Color::Rgb(10, 49, 97),      // Blue
            primary: Color::Rgb(179, 25, 66),  // Red
            secondary: Color::Rgb(10, 49, 97), // Blue
            accent: Color::Rgb(179, 25, 66),   // Red
        }
    }

    pub fn usa_3() -> Self {
        Self {
            name: "usa3".to_string(),
            bg: Color::Rgb(10, 49, 97),           // Blue
            text: Color::Rgb(255, 255, 255),      // White
            primary: Color::Rgb(179, 25, 66),     // Red
            secondary: Color::Rgb(255, 255, 255), // White
            accent: Color::Rgb(179, 25, 66),      // Red
        }
    }

    pub fn usa_4() -> Self {
        Self {
            name: "usa4".to_string(),
            bg: Color::Rgb(10, 49, 97),         // Blue
            text: Color::Rgb(255, 255, 255),    // White
            primary: Color::Rgb(255, 255, 255), // White
            secondary: Color::Rgb(179, 25, 66), // Red
            accent: Color::Rgb(179, 25, 66),    // Red
        }
    }

    pub fn who_dat() -> Self {
        Self {
            name: "whodat".to_string(),
            bg: Color::Rgb(0, 0, 0),              // Pure Black
            text: Color::Rgb(255, 255, 255),      // White
            primary: Color::Rgb(211, 188, 141),   // Gold
            secondary: Color::Rgb(255, 255, 255), // White
            accent: Color::Rgb(211, 188, 141),    // Gold
        }
    }

    pub fn bumble() -> Self {
        Self {
            name: "bumble".to_string(),
            bg: Color::Rgb(0, 0, 0),           // Black
            text: Color::Rgb(255, 255, 255),   // White
            primary: Color::Rgb(255, 235, 0),  // Yellow
            secondary: Color::Rgb(40, 40, 40), // Dark Gray
            accent: Color::Rgb(255, 235, 0),   // Yellow
        }
    }

    pub fn amigo_1() -> Self {
        Self {
            name: "amigo1".to_string(),
            bg: Color::Rgb(0, 104, 71),           // Mexican Green
            text: Color::Rgb(255, 255, 255),      // White
            primary: Color::Rgb(206, 17, 38),     // Mexican Red
            secondary: Color::Rgb(255, 255, 255), // White
            accent: Color::Rgb(206, 17, 38),      // Red
        }
    }

    pub fn amigo_2() -> Self {
        Self {
            name: "amigo2".to_string(),
            bg: Color::Rgb(206, 17, 38),          // Mexican Red
            text: Color::Rgb(255, 255, 255),      // White
            primary: Color::Rgb(0, 104, 71),      // Mexican Green
            secondary: Color::Rgb(255, 255, 255), // White
            accent: Color::Rgb(0, 104, 71),       // Green
        }
    }

    pub fn amigo_3() -> Self {
        Self {
            name: "amigo3".to_string(),
            bg: Color::Rgb(255, 255, 255),     // White
            text: Color::Rgb(0, 104, 71),      // Green
            primary: Color::Rgb(206, 17, 38),  // Red
            secondary: Color::Rgb(0, 104, 71), // Green
            accent: Color::Rgb(206, 17, 38),   // Red
        }
    }

    pub fn amigo_4() -> Self {
        Self {
            name: "amigo4".to_string(),
            bg: Color::Rgb(255, 255, 255),      // White
            text: Color::Rgb(206, 17, 38),      // Red
            primary: Color::Rgb(0, 104, 71),    // Green
            secondary: Color::Rgb(206, 17, 38), // Red
            accent: Color::Rgb(0, 104, 71),     // Green
        }
    }

    pub fn bollywood_1() -> Self {
        Self {
            name: "bollywood1".to_string(),
            bg: Color::Rgb(255, 153, 51),         // Saffron
            text: Color::Rgb(255, 255, 255),      // White
            primary: Color::Rgb(19, 136, 8),      // India Green
            secondary: Color::Rgb(255, 255, 255), // White
            accent: Color::Rgb(19, 136, 8),       // Green
        }
    }

    pub fn bollywood_2() -> Self {
        Self {
            name: "bollywood2".to_string(),
            bg: Color::Rgb(19, 136, 8),           // India Green
            text: Color::Rgb(255, 255, 255),      // White
            primary: Color::Rgb(255, 153, 51),    // Saffron
            secondary: Color::Rgb(255, 255, 255), // White
            accent: Color::Rgb(255, 153, 51),     // Saffron
        }
    }

    pub fn built_ins() -> Vec<Self> {
        vec![
            Self::cmd(),
            Self::default_theme(),
            Self::earth(),
            Self::knicks_in_5(),
            Self::lime(),
            Self::los_doyers_1(),
            Self::los_doyers_2(),
            Self::los_doyers_3(),
            Self::ocean(),
            Self::osx(),
            Self::plum(),
            Self::posh(),
            Self::starburst(),
            Self::tifosi(),
            Self::ubu(),
            Self::usa_1(),
            Self::usa_2(),
            Self::usa_3(),
            Self::usa_4(),
            Self::who_dat(),
            Self::bumble(),
            Self::amigo_1(),
            Self::amigo_2(),
            Self::amigo_3(),
            Self::amigo_4(),
            Self::bollywood_1(),
            Self::bollywood_2(),
        ]
    }

    pub fn get_by_index(idx: usize) -> Self {
        let mut all_themes = Self::built_ins();
        all_themes.extend(crate::prefs::load_custom_themes());
        let wrapped_idx = idx % all_themes.len();
        all_themes.remove(wrapped_idx)
    }
}
