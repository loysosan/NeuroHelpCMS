-- MySQL dump 10.13  Distrib 9.3.0, for macos15.2 (arm64)
--
-- Host: 127.0.0.1    Database: userdb
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `administrators`
--

DROP TABLE IF EXISTS `administrators`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `administrators` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `username` varchar(191) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` enum('Active','Disabled') NOT NULL DEFAULT 'Active',
  `role` enum('admin','moderator') NOT NULL DEFAULT 'admin',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `refresh_token` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uni_administrators_email` (`email`),
  UNIQUE KEY `uni_administrators_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `administrators`
--

LOCK TABLES `administrators` WRITE;
/*!40000 ALTER TABLE `administrators` DISABLE KEYS */;
INSERT INTO `administrators` VALUES (1,'alex.bulba@first.co','admin','$2b$12$ecDeXOvotUWNjGucPQMmzeRSHhkRHmCspdA6o.OvCu55sYZeTTV06','Oleksandr','Krasilia',NULL,'Active','admin','2025-07-12 03:41:41.000','2025-07-12 04:24:32.290','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzUyODk5MDcyfQ.VUvM6R64mQfZGnx-fLkWWLhsNmiQxG9GpAr75VugZxc'),(4,'snumrs@gnat.com','moder','$2a$10$arT/RhmWHfkuYARZaPXGO.33ZD0cnkNlsQCFxJ5tRvF2Xg9xX72qW','Moder','Moderovich','380990966204','Active','moderator','2025-06-20 16:32:26.539','2025-06-20 16:32:26.539',NULL),(5,'pizdato@kukuruza.pom','admin2','$2a$10$34MN/IsyxfE/aVgPq4zteurt7ZsEVoO5UX3DxSgLTBnIPQQqNK.z6','Admin','Adminovich','380992233999','Active','admin','2025-06-20 16:34:06.029','2025-06-20 16:34:06.029',NULL),(6,'palkov@nn.com','eblalkov','$2a$10$Pbg2GFDhoI1VNQoQSqfMKuLOsKdC43PRuFt1LOJ82IJXodaKOhQM6','Palkov','Somethiong','39009900999','Active','moderator','2025-06-22 16:04:12.474','2025-06-22 16:04:12.474',NULL);
/*!40000 ALTER TABLE `administrators` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `availabilities`
--

DROP TABLE IF EXISTS `availabilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `availabilities` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `psychologist_id` bigint unsigned NOT NULL,
  `start_time` datetime(3) NOT NULL,
  `end_time` datetime(3) NOT NULL,
  `status` enum('available','booked') NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_users_availability` (`psychologist_id`),
  CONSTRAINT `fk_users_availability` FOREIGN KEY (`psychologist_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `availabilities`
--

LOCK TABLES `availabilities` WRITE;
/*!40000 ALTER TABLE `availabilities` DISABLE KEYS */;
/*!40000 ALTER TABLE `availabilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blog_posts`
--

DROP TABLE IF EXISTS `blog_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blog_posts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `psychologist_id` bigint unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `visible` enum('public','registed','shadow','deleted') NOT NULL DEFAULT 'public',
  PRIMARY KEY (`id`),
  KEY `fk_users_blog_posts` (`psychologist_id`),
  CONSTRAINT `fk_users_blog_posts` FOREIGN KEY (`psychologist_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blog_posts`
--

LOCK TABLES `blog_posts` WRITE;
/*!40000 ALTER TABLE `blog_posts` DISABLE KEYS */;
/*!40000 ALTER TABLE `blog_posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (3,'Всяка хуета ldf1','2025-06-16 12:56:50.919'),(4,'Kakova1','2025-06-16 13:03:50.982'),(5,'Корекція поведінки','2025-06-20 07:55:19.102'),(6,'Something','2025-06-22 16:03:27.255'),(7,'222','2025-06-29 19:54:26.690'),(8,'22223333','2025-07-10 19:58:28.689');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `diplomas`
--

DROP TABLE IF EXISTS `diplomas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diplomas` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `portfolio_id` bigint unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `institution` varchar(255) NOT NULL,
  `issue_date` date NOT NULL,
  `document_url` varchar(255) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_portfolios_diplomas` (`portfolio_id`),
  CONSTRAINT `fk_portfolios_diplomas` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diplomas`
--

LOCK TABLES `diplomas` WRITE;
/*!40000 ALTER TABLE `diplomas` DISABLE KEYS */;
/*!40000 ALTER TABLE `diplomas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sender_id` bigint unsigned DEFAULT NULL,
  `sender_type` enum('user','admin') NOT NULL,
  `receiver_id` bigint unsigned DEFAULT NULL,
  `receiver_type` enum('user','admin') NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_users_messages_sent` (`sender_id`),
  KEY `fk_users_messages_received` (`receiver_id`),
  CONSTRAINT `fk_administrators_messages_received` FOREIGN KEY (`receiver_id`) REFERENCES `administrators` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_administrators_messages_sent` FOREIGN KEY (`sender_id`) REFERENCES `administrators` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_users_messages_received` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_users_messages_sent` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `news`
--

DROP TABLE IF EXISTS `news`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `news` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `summary` varchar(500) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT '1',
  `published` tinyint(1) DEFAULT '0',
  `author_id` bigint unsigned NOT NULL,
  `views` bigint DEFAULT '0',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `show_on_home` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_news_deleted_at` (`deleted_at`),
  KEY `fk_news_author` (`author_id`),
  CONSTRAINT `fk_news_author` FOREIGN KEY (`author_id`) REFERENCES `administrators` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `news`
--

LOCK TABLES `news` WRITE;
/*!40000 ALTER TABLE `news` DISABLE KEYS */;
INSERT INTO `news` VALUES (1,'jhgjhлоло','<p>kjlkjlkjlkдлолол</p>','kjkjkдлол','',1,1,1,7,'2025-06-30 16:01:15.494','2025-07-09 14:39:47.471',NULL,1),(2,'Неймовірна їбаніна','<p>Він обережно ступає по скрипучому паркету, намагаючись не розбудити кота, який із цікавістю визирає крізь щілину у дверях. Бабуся, почувши тихий шелест, запалює лампу й регоче в своїх затишних капцях, а глиняний чайник весело бурмоче на плиті. Слон, звично лапами неохопно торкаючись підлоги, розповідає про свої дивовижні мандри: як він зустрічав пінгвіна-баристу на Північному полюсі, що напував його гарячим какао із айсбергової крижинки; як у пустелі він випадково натрапив на караван веселих мишей-музикантів; як у високих горах його запросили на бенкет у гостинному драконі.</p><p><br></p><p>Бабуся кладе на стіл смачнючу хрумку булку, і вони сидять до самого світанку, смакують чай, діляться абсурдними історіями й відчувають, що це — справжнє свято безумства та дружби, де немає місця буденності, а є тільки нескінченна карусель фантазії й радості.</p>','Бабуся кладе на стіл смачнючу хрумку булку, і вони сидять до самого світанку, смакують чай, діляться абсурдними історіями й відчувають, що це — справжнє свято безумства та дружби, де немає місця буденності, а є тільки нескінченна карусель фантазії й радості.','',1,1,1,4,'2025-07-02 09:11:04.933','2025-07-10 20:00:14.504',NULL,0);
/*!40000 ALTER TABLE `news` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `photos`
--

DROP TABLE IF EXISTS `photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `photos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `portfolio_id` bigint unsigned NOT NULL,
  `url` varchar(255) NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_portfolios_photos` (`portfolio_id`),
  CONSTRAINT `fk_portfolios_photos` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `photos`
--

LOCK TABLES `photos` WRITE;
/*!40000 ALTER TABLE `photos` DISABLE KEYS */;
INSERT INTO `photos` VALUES (5,1,'/uploads/15_1751147591_Знімок екрана 2025-02-27 о 14.17.19.png','2025-06-28 21:53:11.907'),(6,1,'/uploads/15_1751220237_2024-11-08 17.36.58.jpg','2025-06-29 18:03:57.492'),(7,1,'/uploads/portfolio/1751226180038164258.jpg','2025-06-29 19:43:00.042'),(8,3,'/uploads/portfolio/a09ae2aeb34e6ece32e657f2a76931bc.jpg','2025-06-29 20:30:25.239');
/*!40000 ALTER TABLE `photos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plans`
--

DROP TABLE IF EXISTS `plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plans` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `duration_days` bigint DEFAULT NULL,
  `features` text,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plans`
--

LOCK TABLES `plans` WRITE;
/*!40000 ALTER TABLE `plans` DISABLE KEYS */;
INSERT INTO `plans` VALUES (3,'Free','Something chip plan',0.00,10000000000030,'nothing','2025-06-14 21:22:25.089','2025-06-14 21:22:25.089'),(6,'Rich Bitch','Payment plan for rich bitches',100.00,30,'rich bitch plan','2025-06-20 16:00:45.087','2025-06-20 16:00:45.087'),(7,'Poor bitch','ff',50.00,30,'Plan for poor bitches','2025-06-22 16:03:16.161','2025-06-22 16:03:16.161'),(8,'Hui','Hui',500.00,30,'ksd','2025-06-29 19:55:01.200','2025-06-29 19:55:01.200');
/*!40000 ALTER TABLE `plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `portfolios`
--

DROP TABLE IF EXISTS `portfolios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `portfolios` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `psychologist_id` bigint unsigned NOT NULL,
  `description` text,
  `contact_email` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `experience` bigint DEFAULT '0',
  `education` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uni_portfolios_psychologist_id` (`psychologist_id`),
  CONSTRAINT `fk_users_portfolio` FOREIGN KEY (`psychologist_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `portfolios`
--

LOCK TABLES `portfolios` WRITE;
/*!40000 ALTER TABLE `portfolios` DISABLE KEYS */;
INSERT INTO `portfolios` VALUES (1,15,'вфівфівфів1111','spec@autist.com','30990044000','2025-06-28 21:52:32.045','2025-06-29 19:42:42.949',2,'фівфівів'),(3,17,'Я — сертифікований психолог із понад п’ятьма роками практики, спеціалізуюся на когнітивно-поведінковій терапії, психологічному консультуванні дорослих та підлітків. Проводжу індивідуальні та групові сесії, використовуючи сучасні методики роботи зі стресом, тривожними станами та міжособистісними конфліктами. Маю досвід роботи з кризовими ситуаціями, підтримую клієнтів у процесі самопізнання та розвитку внутрішніх ресурсів. У своїй роботі поєдную емпатію, професійну об’єктивність та науковий підхід: маналізую індивідуальні особливості, створюю безпечне середовище, де клієнт може відкрито говорити про свої переживання. Регулярно підвищую кваліфікацію, беру участь у тренінгах і семінарах, слідкую за новітніми дослідженнями в галузі психології. Моя мета — допомогти кожному знайти внутрішній баланс і досягти гармонії в житті. Пропоную онлайн- та офлайн-консультації, розробляю індивідуальні плани з чіткими цілями, гарантую повну конфіденційність і підтримку протягом усього процесу. Завжди тут.','ohuennyspec@ppdc.com','3090003394043','2025-06-29 19:56:15.947','2025-07-05 18:57:53.965',13,'Національний університет марно витраченого часу (НУМВЧ)\nКурс для галочки Оксфордського університету (ББЦ)12');
/*!40000 ALTER TABLE `portfolios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `psychologist_skills`
--

DROP TABLE IF EXISTS `psychologist_skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `psychologist_skills` (
  `psychologist_id` bigint unsigned NOT NULL,
  `skill_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`psychologist_id`,`skill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `psychologist_skills`
--

LOCK TABLES `psychologist_skills` WRITE;
/*!40000 ALTER TABLE `psychologist_skills` DISABLE KEYS */;
INSERT INTO `psychologist_skills` VALUES (15,4),(17,1),(17,4),(17,5);
/*!40000 ALTER TABLE `psychologist_skills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ratings`
--

DROP TABLE IF EXISTS `ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ratings` (
  `psychologist_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `average_rating` double NOT NULL,
  `review_count` bigint NOT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`psychologist_id`),
  CONSTRAINT `fk_users_rating` FOREIGN KEY (`psychologist_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ratings`
--

LOCK TABLES `ratings` WRITE;
/*!40000 ALTER TABLE `ratings` DISABLE KEYS */;
/*!40000 ALTER TABLE `ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `psychologist_id` bigint unsigned NOT NULL,
  `client_id` bigint unsigned NOT NULL,
  `rating` bigint NOT NULL,
  `comment` text,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_users_reviews` (`psychologist_id`),
  CONSTRAINT `fk_users_reviews` FOREIGN KEY (`psychologist_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_reviews_rating` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `psychologist_id` bigint unsigned DEFAULT NULL,
  `client_id` bigint unsigned NOT NULL,
  `start_time` datetime(3) NOT NULL,
  `end_time` datetime(3) NOT NULL,
  `status` enum('pending','confirmed','completed','canceled') NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_users_sessions` (`psychologist_id`),
  CONSTRAINT `fk_users_sessions` FOREIGN KEY (`psychologist_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `skills`
--

DROP TABLE IF EXISTS `skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `skills` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `category_id` bigint unsigned DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_categories_skills` (`category_id`),
  CONSTRAINT `fk_categories_skills` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `skills`
--

LOCK TABLES `skills` WRITE;
/*!40000 ALTER TABLE `skills` DISABLE KEYS */;
INSERT INTO `skills` VALUES (1,'Хуета 1',3,'2025-06-16 12:44:15.537'),(2,'ББД',4,'2025-06-16 12:51:05.376'),(4,'Разна',6,'2025-06-16 13:04:01.063'),(5,'fff',3,'2025-06-19 19:14:20.488'),(6,'Навчу їсти ложкою',5,'2025-06-20 07:55:47.640'),(7,'222',7,'2025-06-29 19:54:33.303'),(8,'Хуеееееететете',8,'2025-07-10 19:58:42.235');
/*!40000 ALTER TABLE `skills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('client','psychologist') NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` enum('Active','Disabled','Blocked') NOT NULL DEFAULT 'Disabled',
  `plan_id` bigint unsigned DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `verified` tinyint(1) NOT NULL DEFAULT '0',
  `verification_token` varchar(64) DEFAULT NULL,
  `token_sent_at` datetime(3) DEFAULT NULL,
  `refresh_token` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uni_users_email` (`email`),
  KEY `idx_users_verification_token` (`verification_token`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (7,'snumrs@gmail.com','$2a$10$KoccLWfH1IYUqDWDTzmG6esKBg.20.mr054QXC2dL.omKwqV/B7lK','psychologist','Еблак','Хуеплет','3806699112971','Active',6,'2025-06-13 18:54:09.609','2025-07-04 18:32:02.289',1,'','2025-06-13 18:54:09.609',NULL),(8,'por@dda.com','$2a$10$/M23y9u9/flNUvd6lXJqKeZTUm6CrbmruOULVjGz8Rip60UNdhDH.','psychologist','Finger','Inass','380880033999','Active',8,'2025-06-14 20:14:45.701','2025-07-10 19:59:02.714',1,'','2025-06-14 20:14:45.701',NULL),(9,'ss@dfsfdf.com','$2a$10$EUHEAPkwN6Ks85OnXizYoeFNEBE/92e4GZLWF3yppKWufS.UxcV2q','client','Sonya','Krasilia','38900002233','Blocked',6,'2025-06-20 07:54:28.983','2025-07-12 04:36:45.690',1,'','2025-06-20 07:54:28.983',NULL),(15,'palkov@ebalkov.com','$2a$10$JRtFDfxo0YTEXxALHlJ1y./E6w5LCoGyMLPeb3LhK5RupJsnuOELC','client','Ooo11','Bbb','30993344900','Disabled',NULL,'2025-06-28 21:52:32.035','2025-07-10 21:08:34.866',1,'','2025-06-28 21:52:32.035','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InBhbGtvdkBlYmFsa292LmNvbSIsImV4cCI6MTc1MTgzMDk0NCwiaWF0IjoxNzUxMjI2MTQ0fQ.5vCDqTzT8Pr2A4Us1OnmJKw4BxSMIuAA5-fHZA3zsQ0'),(17,'alex10mmm@gmail.com','$2a$10$tDpvMRxTSOzU5roQphz9DutBe/.Scn6ay8Dar2VArMK2uRKPQRyby','psychologist','Oleksandr','Krasilia1','0990966203','Active',6,'2025-06-29 19:56:15.929','2025-07-12 02:41:54.354',1,'','2025-06-29 19:56:15.951','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFsZXgxMG1tbUBnbWFpbC5jb20iLCJleHAiOjE3NTI4OTI5MTQsImlhdCI6MTc1MjI4ODExNH0.esvaGMck_ygW73ARm0XAZ3jd2O3CjNzG5T15NCLUUPw');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-12 17:30:23
