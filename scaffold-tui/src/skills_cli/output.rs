use crossterm::style::{Attribute, Color, ResetColor, SetAttribute, SetForegroundColor};
use std::fmt::Display;
use std::io::{stdout, Write};

#[derive(Debug, Clone)]
pub struct OutputConfig {
    pub json: bool,
    pub no_color: bool,
    pub verbose: bool,
    pub quiet: bool,
}

impl Default for OutputConfig {
    fn default() -> Self {
        Self {
            json: false,
            no_color: false,
            verbose: false,
            quiet: false,
        }
    }
}

pub struct Printer {
    config: OutputConfig,
}

impl Printer {
    pub fn new(config: OutputConfig) -> Self {
        Self { config }
    }

    pub fn is_json(&self) -> bool {
        self.config.json
    }

    pub fn print_json<T: serde::Serialize>(&self, val: &T) {
        if let Ok(json_str) = serde_json::to_string_pretty(val) {
            println!("{}", json_str);
        }
    }

    pub fn print_json_error(&self, code: i32, error_type: &str, message: &str) {
        let err = serde_json::json!({
            "error": true,
            "code": code,
            "type": error_type,
            "message": message
        });
        println!("{}", serde_json::to_string_pretty(&err).unwrap());
    }

    pub fn header(&self, text: &str) {
        if self.config.quiet || self.config.json {
            return;
        }
        if self.config.no_color {
            println!("\n=== {} ===", text);
        } else {
            let mut out = stdout();
            let _ = write!(
                out,
                "\n{}{}{}{}\n",
                SetForegroundColor(Color::Cyan),
                SetAttribute(Attribute::Bold),
                text,
                ResetColor
            );
            let _ = write!(out, "{}", SetAttribute(Attribute::Reset));
            let _ = out.flush();
        }
    }

    pub fn category_header(&self, name: &str, count: usize) {
        if self.config.quiet || self.config.json {
            return;
        }
        if self.config.no_color {
            println!("\n {} ({})", name, count);
            println!(" {}", "-".repeat(50));
        } else {
            let mut out = stdout();
            let _ = write!(
                out,
                "\n {}{}{} ({}){}\n",
                SetForegroundColor(Color::Cyan),
                SetAttribute(Attribute::Bold),
                name,
                count,
                ResetColor
            );
            let _ = write!(
                out,
                " {}{}{}\n",
                SetForegroundColor(Color::DarkGrey),
                "─".repeat(50),
                ResetColor
            );
            let _ = write!(out, "{}", SetAttribute(Attribute::Reset));
            let _ = out.flush();
        }
    }

    pub fn skill_row(&self, slug: &str, version: &str, desc: &str) {
        if self.config.quiet || self.config.json {
            return;
        }
        if self.config.no_color {
            println!("  {:<26} v{:<4} {}", slug, version, desc);
        } else {
            let mut out = stdout();
            let _ = write!(
                out,
                "  {}{}{:<26}{} {}{:<5}{} {}{}{}\n",
                SetForegroundColor(Color::White),
                SetAttribute(Attribute::Bold),
                slug,
                ResetColor,
                SetForegroundColor(Color::Magenta),
                format!("v{}", version),
                ResetColor,
                SetForegroundColor(Color::DarkGrey),
                desc,
                ResetColor
            );
            let _ = write!(out, "{}", SetAttribute(Attribute::Reset));
            let _ = out.flush();
        }
    }

    pub fn success(&self, message: impl Display) {
        if self.config.quiet || self.config.json {
            return;
        }
        if self.config.no_color {
            println!(" [OK] {}", message);
        } else {
            let mut out = stdout();
            let _ = write!(
                out,
                " {}{}[OK]{} {}\n",
                SetForegroundColor(Color::Green),
                SetAttribute(Attribute::Bold),
                ResetColor,
                message
            );
            let _ = write!(out, "{}", SetAttribute(Attribute::Reset));
            let _ = out.flush();
        }
    }

    pub fn warning(&self, message: impl Display) {
        if self.config.quiet || self.config.json {
            return;
        }
        if self.config.no_color {
            println!(" [WARN] {}", message);
        } else {
            let mut out = stdout();
            let _ = write!(
                out,
                " {}{}[WARN]{} {}\n",
                SetForegroundColor(Color::Yellow),
                SetAttribute(Attribute::Bold),
                ResetColor,
                message
            );
            let _ = write!(out, "{}", SetAttribute(Attribute::Reset));
            let _ = out.flush();
        }
    }

    pub fn error(&self, message: impl Display) {
        if self.config.json {
            return;
        }
        if self.config.no_color {
            eprintln!(" [ERROR] {}", message);
        } else {
            let mut out = stdout();
            let _ = write!(
                out,
                " {}{}[ERROR]{} {}\n",
                SetForegroundColor(Color::Red),
                SetAttribute(Attribute::Bold),
                ResetColor,
                message
            );
            let _ = write!(out, "{}", SetAttribute(Attribute::Reset));
            let _ = out.flush();
        }
    }

    pub fn info(&self, message: impl Display) {
        if self.config.quiet || self.config.json {
            return;
        }
        println!(" {}", message);
    }
}
