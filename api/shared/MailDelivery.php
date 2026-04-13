<?php

namespace Shared;

use RuntimeException;

/**
 * Envio de e-mail via SMTP (AUTH LOGIN) ou função mail() do PHP.
 */
class MailDelivery
{
    public static function sendHtml(string $toEmail, string $subject, string $htmlBody): bool
    {
        $toEmail = trim($toEmail);
        if ($toEmail === '' || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $subjectLine = self::encodeSubject($subject);

        if (MAIL_SMTP_HOST !== '') {
            try {
                self::sendSmtpHtml($toEmail, $subjectLine, $htmlBody);
                return true;
            } catch (\Throwable $e) {
                Logger::getInstance()->error('MailDelivery SMTP: ' . $e->getMessage());
                return self::tryPhpMail($toEmail, $subjectLine, $htmlBody);
            }
        }

        return self::tryPhpMail($toEmail, $subjectLine, $htmlBody);
    }

    private static function tryPhpMail(string $toEmail, string $subjectLine, string $htmlBody): bool
    {
        $from = MAIL_FROM_ADDRESS;
        $fromName = MAIL_FROM_NAME;
        $encodedFromName = self::encodeSubject($fromName);
        $headers = [
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . $encodedFromName . ' <' . $from . '>',
        ];
        $headerStr = implode("\r\n", $headers);

        $ok = @mail($toEmail, $subjectLine, $htmlBody, $headerStr);
        if (!$ok) {
            Logger::getInstance()->error('MailDelivery mail() retornou false para ' . $toEmail);
        }
        return $ok;
    }

    private static function encodeSubject(string $subject): string
    {
        if (function_exists('mb_encode_mimeheader')) {
            return mb_encode_mimeheader($subject, 'UTF-8', 'B', "\r\n");
        }
        return '=?UTF-8?B?' . base64_encode($subject) . '?=';
    }

    /**
     * @param resource $fp
     */
    private static function smtpReadCode($fp): int
    {
        $code = 0;
        while (($line = fgets($fp, 8192)) !== false) {
            if (strlen($line) < 4) {
                continue;
            }
            $code = (int) substr($line, 0, 3);
            if ($line[3] === ' ') {
                break;
            }
        }
        return $code;
    }

    /**
     * @param resource $fp
     */
    private static function smtpExpect($fp, int $expected): void
    {
        $code = self::smtpReadCode($fp);
        if ($code !== $expected) {
            throw new RuntimeException("Resposta SMTP inesperada: {$code} (esperado {$expected})");
        }
    }

    /**
     * @param resource $fp
     */
    private static function smtpSend($fp, string $line): void
    {
        fwrite($fp, $line . "\r\n");
    }

    private static function sendSmtpHtml(string $toEmail, string $subjectLine, string $htmlBody): void
    {
        $host = MAIL_SMTP_HOST;
        $port = MAIL_SMTP_PORT;
        $user = MAIL_SMTP_USER;
        $pass = MAIL_SMTP_PASS;
        $enc = MAIL_SMTP_ENCRYPTION;
        $from = MAIL_FROM_ADDRESS;

        if ($from === '' || !filter_var($from, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('MAIL_FROM_ADDRESS inválido');
        }

        $remote = ($enc === 'ssl')
            ? 'ssl://' . $host . ':' . $port
            : 'tcp://' . $host . ':' . $port;

        $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true]]);
        $fp = @stream_socket_client(
            $remote,
            $errno,
            $errstr,
            25,
            STREAM_CLIENT_CONNECT,
            $ctx
        );

        if (!$fp) {
            throw new RuntimeException("Falha ao conectar SMTP: {$errstr} ({$errno})");
        }

        stream_set_timeout($fp, 25);

        try {
            self::smtpExpect($fp, 220);

            self::smtpSend($fp, 'EHLO nexora.local');
            self::smtpExpect($fp, 250);

            if ($enc === 'tls') {
                self::smtpSend($fp, 'STARTTLS');
                self::smtpExpect($fp, 220);
                if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                    throw new RuntimeException('Falha no STARTTLS');
                }
                self::smtpSend($fp, 'EHLO nexora.local');
                self::smtpExpect($fp, 250);
            }

            if ($user !== '' && $pass !== '') {
                self::smtpSend($fp, 'AUTH LOGIN');
                self::smtpExpect($fp, 334);
                self::smtpSend($fp, base64_encode($user));
                self::smtpExpect($fp, 334);
                self::smtpSend($fp, base64_encode($pass));
                self::smtpExpect($fp, 235);
            }

            self::smtpSend($fp, 'MAIL FROM:<' . $from . '>');
            self::smtpExpect($fp, 250);

            self::smtpSend($fp, 'RCPT TO:<' . $toEmail . '>');
            $rcpt = self::smtpReadCode($fp);
            if ($rcpt !== 250 && $rcpt !== 251) {
                throw new RuntimeException('RCPT TO recusado: ' . $rcpt);
            }

            self::smtpSend($fp, 'DATA');
            self::smtpExpect($fp, 354);

            $boundary = 'b' . bin2hex(random_bytes(8));
            $fromName = self::encodeSubject(MAIL_FROM_NAME);
            $headers = [
                'From: ' . $fromName . ' <' . $from . '>',
                'To: <' . $toEmail . '>',
                'Subject: ' . $subjectLine,
                'MIME-Version: 1.0',
                'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
            ];

            $plain = trim(strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $htmlBody)));

            $body = '--' . $boundary . "\r\n";
            $body .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
            $body .= $plain . "\r\n\r\n";
            $body .= '--' . $boundary . "\r\n";
            $body .= "Content-Type: text/html; charset=UTF-8\r\n\r\n";
            $body .= $htmlBody . "\r\n\r\n";
            $body .= '--' . $boundary . "--\r\n";

            $payload = implode("\r\n", $headers) . "\r\n\r\n" . $body;
            $payload = str_replace("\n.", "\n..", $payload);
            fwrite($fp, $payload . "\r\n.\r\n");

            self::smtpExpect($fp, 250);

            self::smtpSend($fp, 'QUIT');
        } finally {
            fclose($fp);
        }
    }
}
