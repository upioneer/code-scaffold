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
}
