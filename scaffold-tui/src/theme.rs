use ratatui::style::Color;

#[derive(Debug, Clone)]
pub struct Theme {
    pub bg: Color,
    pub text: Color,
    pub primary: Color,
    pub secondary: Color,
    pub accent: Color,
}

impl Theme {
    pub fn plum() -> Self {
        Self {
            bg: Color::Rgb(10, 15, 30),
            text: Color::Rgb(248, 250, 252),
            primary: Color::Rgb(59, 170, 196),   // #3baac4
            secondary: Color::Rgb(59, 102, 196), // #3b66c4
            accent: Color::Rgb(85, 59, 196),     // #553bc4
        }
    }

    pub fn lime() -> Self {
        Self {
            bg: Color::Rgb(15, 30, 15),
            text: Color::Rgb(248, 250, 252),
            primary: Color::Rgb(40, 215, 47),    // #28d72f
            secondary: Color::Rgb(120, 215, 40), // #78d728
            accent: Color::Rgb(208, 215, 40),    // #d0d728
        }
    }

    pub fn ocean() -> Self {
        Self {
            bg: Color::Rgb(10, 25, 30),
            text: Color::Rgb(248, 250, 252),
            primary: Color::Rgb(70, 185, 160),   // #46b9a0
            secondary: Color::Rgb(70, 152, 185), // #4698b9
            accent: Color::Rgb(70, 185, 103),    // #46b967
        }
    }

    pub fn earth() -> Self {
        Self {
            bg: Color::Rgb(25, 20, 15),
            text: Color::Rgb(248, 250, 252),
            primary: Color::Rgb(123, 167, 88),   // #7ba758
            secondary: Color::Rgb(167, 132, 88), // #a78458
            accent: Color::Rgb(162, 167, 88),    // #a2a758
        }
    }

    pub fn starburst() -> Self {
        Self {
            bg: Color::Rgb(15, 15, 10),
            text: Color::Rgb(248, 250, 252),
            primary: Color::Rgb(172, 247, 8),  // #acf708
            secondary: Color::Rgb(52, 247, 8), // #34f708
            accent: Color::Rgb(247, 203, 8),   // #f7cb08
        }
    }

    pub fn default_theme() -> Self {
        Self {
            bg: Color::Rgb(10, 15, 30),
            text: Color::Rgb(248, 250, 252),
            primary: Color::Rgb(243, 210, 12), // #f3d20c (Yellow Active Borders)
            secondary: Color::Rgb(100, 116, 139), // Muted Slate Gray Inactive Borders
            accent: Color::Rgb(12, 45, 243),   // #0c2df3 (Blue Folders/Accents)
        }
    }

    pub fn get_by_index(idx: usize) -> Self {
        match idx % 6 {
            0 => Self::default_theme(),
            1 => Self::plum(),
            2 => Self::lime(),
            3 => Self::ocean(),
            4 => Self::earth(),
            5 => Self::starburst(),
            _ => Self::default_theme(),
        }
    }
}
