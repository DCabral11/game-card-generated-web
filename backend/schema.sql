CREATE DATABASE IF NOT EXISTS city_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE city_game;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'team') NOT NULL,
  display_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id INT PRIMARY KEY,
  pin_code VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS checkins (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  post_id INT NOT NULL,
  presence_points INT NOT NULL,
  game_points INT NOT NULL,
  total_points INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_team_post (team_id, post_id),
  CONSTRAINT fk_checkins_team FOREIGN KEY (team_id) REFERENCES users(id),
  CONSTRAINT fk_checkins_post FOREIGN KEY (post_id) REFERENCES posts(id)
);

INSERT INTO users (username, password_hash, role, display_name)
VALUES ('admin', 'admin123', 'admin', 'Administrador')
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

INSERT INTO posts (id, pin_code) VALUES
(1, '1430'), (2, '1437'), (3, '1444'), (4, '1451'), (5, '1458'),
(6, '1465'), (7, '1472'), (8, '1479'), (9, '1486'), (10, '1493')
ON DUPLICATE KEY UPDATE pin_code = VALUES(pin_code);

DELIMITER $$
CREATE PROCEDURE seed_teams()
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE user_name VARCHAR(50);
  DECLARE pass_value VARCHAR(50);
  DECLARE display_value VARCHAR(50);

  WHILE i <= 40 DO
    SET user_name = CONCAT('team', LPAD(i, 2, '0'));
    SET pass_value = CONCAT('city-', LPAD(i, 2, '0'));
    SET display_value = CONCAT('Equipa ', LPAD(i, 2, '0'));

    INSERT INTO users (username, password_hash, role, display_name)
    VALUES (user_name, pass_value, 'team', display_value)
    ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

    SET i = i + 1;
  END WHILE;
END$$
DELIMITER ;

CALL seed_teams();
DROP PROCEDURE seed_teams();
