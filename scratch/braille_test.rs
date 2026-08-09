use std::thread;
use std::time::Duration;

fn main() {
    print!("\x1B[2J"); // Clear screen
    
    let raw_logo = r#"
 ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║██║  ██║█████╗
██║     ██║   ██║██║  ██║██╔══╝
╚██████╗╚██████╔╝██████╔╝███████╗
 ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝
███████╗ ██████╗ █████╗ ███████╗███████╗ ██████╗ ██╗     ██████╗
██╔════╝██╔════╝██╔══██╗██╔════╝██╔════╝██╔═══██╗██║     ██╔══██╗
███████╗██║     ███████║█████╗  █████╗  ██║   ██║██║     ██║  ██║
╚════██║██║     ██╔══██║██╔══╝  ██╔══╝  ██║   ██║██║     ██║  ██║
███████║╚██████╗██║  ██║██║     ██║     ╚██████╔╝███████╗██████╔╝
╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝      ╚═════╝ ╚══════╝╚═════╝"#;
    let logo = raw_logo.trim_start_matches('\n');
    
    for tick in 0..100 {
        print!("\x1B[1;1H"); // Move cursor to 1,1
        
        for (i, line) in logo.lines().enumerate() {
            let mut row_str = String::new();
            for (j, mut ch) in line.chars().enumerate() {
                let char_delay = (i * 2 + (j / 4)) as usize;
                
                if tick < char_delay {
                    ch = ' ';
                } else if tick < char_delay + 10 && ch != ' ' {
                    // Glitch phase
                    let noise = ((i * j * tick) % 255) as u32;
                    ch = char::from_u32(0x2800 + noise).unwrap_or(' ');
                }
                row_str.push(ch);
            }
            println!("{}", row_str);
        }
        thread::sleep(Duration::from_millis(50));
    }
}
