use crate::models::skill::{SkillLockEntry, SkillLockfile};
use anyhow::Result;
use std::fs;
use std::path::{Path, PathBuf};

pub struct LockfileManager {
    lockfile_path: PathBuf,
}

impl LockfileManager {
    pub fn new(target_dir: &Path) -> Self {
        Self {
            lockfile_path: target_dir.join(".skills").join(".lockfile.json"),
        }
    }

    pub fn read(&self) -> SkillLockfile {
        if self.lockfile_path.exists() {
            if let Ok(content) = fs::read_to_string(&self.lockfile_path) {
                if let Ok(lock) = serde_json::from_str::<SkillLockfile>(&content) {
                    return lock;
                }
            }
        }
        SkillLockfile::default()
    }

    pub fn write(&self, lockfile: &SkillLockfile) -> Result<()> {
        if let Some(parent) = self.lockfile_path.parent() {
            fs::create_dir_all(parent)?;
        }
        let json_str = serde_json::to_string_pretty(lockfile)?;
        fs::write(&self.lockfile_path, json_str)?;
        Ok(())
    }

    pub fn record_install(&self, slug: &str, version: &str, installed_dir: &Path) -> Result<()> {
        let mut lock = self.read();
        let (file_count, hash) = calculate_dir_stats(installed_dir)?;

        lock.skills.retain(|s| !s.slug.eq_ignore_ascii_case(slug));
        lock.skills.push(SkillLockEntry {
            slug: slug.to_string(),
            version: version.to_string(),
            installed_at: crate::models::skill::chrono_now(),
            source_hash: hash,
            file_count,
        });
        lock.skills.sort_by(|a, b| a.slug.cmp(&b.slug));
        self.write(&lock)
    }

    pub fn record_uninstall(&self, slug: &str) -> Result<()> {
        let mut lock = self.read();
        lock.skills.retain(|s| !s.slug.eq_ignore_ascii_case(slug));
        self.write(&lock)
    }
}

pub fn calculate_dir_stats(dir: &Path) -> Result<(usize, String)> {
    let mut files = Vec::new();
    collect_files_recursive(dir, dir, &mut files)?;
    files.sort_by(|a, b| a.0.cmp(&b.0));

    let file_count = files.len();
    let mut hasher = Sha256::new();

    for (rel_path, abs_path) in files {
        hasher.update(rel_path.as_bytes());
        if let Ok(bytes) = fs::read(abs_path) {
            hasher.update(&bytes);
        }
    }

    let digest = hasher.finalize();
    Ok((file_count, digest))
}

fn collect_files_recursive(
    root: &Path,
    current: &Path,
    out: &mut Vec<(String, PathBuf)>,
) -> Result<()> {
    if !current.exists() {
        return Ok(());
    }
    for entry in fs::read_dir(current)? {
        let entry = entry?;
        let ft = entry.file_type()?;
        let p = entry.path();
        if ft.is_dir() {
            collect_files_recursive(root, &p, out)?;
        } else if ft.is_file() {
            let rel = p
                .strip_prefix(root)
                .unwrap_or(&p)
                .to_string_lossy()
                .replace('\\', "/");
            out.push((rel, p));
        }
    }
    Ok(())
}

// -----------------------------------------------------------------------------
// Pure, Zero-Dependency Standard SHA-256 Implementation
// -----------------------------------------------------------------------------
struct Sha256 {
    state: [u32; 8],
    count: u64,
    buffer: [u8; 64],
}

impl Sha256 {
    fn new() -> Self {
        Self {
            state: [
                0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab,
                0x5be0cd19,
            ],
            count: 0,
            buffer: [0u8; 64],
        }
    }

    fn update(&mut self, data: &[u8]) {
        let mut index = (self.count as usize) & 0x3f;
        self.count += data.len() as u64;

        let mut data_pos = 0;
        let mut data_left = data.len();

        if index > 0 {
            let space = 64 - index;
            if data_left >= space {
                self.buffer[index..64].copy_from_slice(&data[..space]);
                self.transform(&self.buffer.clone());
                data_pos += space;
                data_left -= space;
                index = 0;
            } else {
                self.buffer[index..index + data_left].copy_from_slice(&data[..data_left]);
                return;
            }
        }

        while data_left >= 64 {
            let chunk: &[u8; 64] = data[data_pos..data_pos + 64].try_into().unwrap();
            self.transform(chunk);
            data_pos += 64;
            data_left -= 64;
        }

        if data_left > 0 {
            self.buffer[0..data_left].copy_from_slice(&data[data_pos..]);
        }
    }

    fn finalize(mut self) -> String {
        let bit_count = self.count * 8;
        let index = (self.count as usize) & 0x3f;
        let pad_len = if index < 56 { 56 - index } else { 120 - index };

        let mut padding = vec![0u8; pad_len + 8];
        padding[0] = 0x80;
        let bits_bytes = bit_count.to_be_bytes();
        padding[pad_len..pad_len + 8].copy_from_slice(&bits_bytes);

        self.update(&padding);

        let mut hex = String::with_capacity(64);
        for s in self.state {
            for b in s.to_be_bytes() {
                hex.push_str(&format!("{:02x}", b));
            }
        }
        hex
    }

    fn transform(&mut self, block: &[u8; 64]) {
        let k: [u32; 64] = [
            0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
            0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
            0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
            0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
            0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
            0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
            0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
            0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
            0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
            0xc67178f2,
        ];

        let mut w = [0u32; 64];
        for i in 0..16 {
            let offset = i * 4;
            w[i] = u32::from_be_bytes(block[offset..offset + 4].try_into().unwrap());
        }

        for i in 16..64 {
            let s0 = w[i - 15].rotate_right(7) ^ w[i - 15].rotate_right(18) ^ (w[i - 15] >> 3);
            let s1 = w[i - 2].rotate_right(17) ^ w[i - 2].rotate_right(19) ^ (w[i - 2] >> 10);
            w[i] = w[i - 16]
                .wrapping_add(s0)
                .wrapping_add(w[i - 7])
                .wrapping_add(s1);
        }

        let mut a = self.state[0];
        let mut b = self.state[1];
        let mut c = self.state[2];
        let mut d = self.state[3];
        let mut e = self.state[4];
        let mut f = self.state[5];
        let mut g = self.state[6];
        let mut h = self.state[7];

        for i in 0..64 {
            let s1 = e.rotate_right(6) ^ e.rotate_right(11) ^ e.rotate_right(25);
            let ch = (e & f) ^ ((!e) & g);
            let temp1 = h
                .wrapping_add(s1)
                .wrapping_add(ch)
                .wrapping_add(k[i])
                .wrapping_add(w[i]);
            let s0 = a.rotate_right(2) ^ a.rotate_right(13) ^ a.rotate_right(22);
            let maj = (a & b) ^ (a & c) ^ (b & c);
            let temp2 = s0.wrapping_add(maj);

            h = g;
            g = f;
            f = e;
            e = d.wrapping_add(temp1);
            d = c;
            c = b;
            b = a;
            a = temp1.wrapping_add(temp2);
        }

        self.state[0] = self.state[0].wrapping_add(a);
        self.state[1] = self.state[1].wrapping_add(b);
        self.state[2] = self.state[2].wrapping_add(c);
        self.state[3] = self.state[3].wrapping_add(d);
        self.state[4] = self.state[4].wrapping_add(e);
        self.state[5] = self.state[5].wrapping_add(f);
        self.state[6] = self.state[6].wrapping_add(g);
        self.state[7] = self.state[7].wrapping_add(h);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sha256_known_vector() {
        let mut hasher = Sha256::new();
        hasher.update(b"hello world");
        let hash = hasher.finalize();
        assert_eq!(
            hash,
            "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
        );
    }

    #[test]
    fn test_sha256_empty_string() {
        let hasher = Sha256::new();
        let hash = hasher.finalize();
        assert_eq!(
            hash,
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        );
    }
}
