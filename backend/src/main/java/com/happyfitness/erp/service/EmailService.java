package com.happyfitness.erp.service;

import com.happyfitness.erp.model.Client;
import com.happyfitness.erp.model.Membership;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.Random;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private PdfInvoiceService pdfInvoiceService;

    private static final String FROM_EMAIL = "noreply@gymflow.ma";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public String generateVerificationCode() {
        return String.format("%06d", new Random().nextInt(999999));
    }

    public void sendVerificationCode(String toEmail, String clientName, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(FROM_EMAIL);
            helper.setTo(toEmail);
            helper.setSubject("GymFlow - Vérification de votre adresse email");
            helper.setText(buildVerificationHtml(clientName, code), true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Erreur lors de l'envoi de l'email de vérification", e);
        }
    }

    public void sendInvoiceEmail(Client client, Membership membership) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(FROM_EMAIL);
            helper.setTo(client.getEmail());
            helper.setSubject("GymFlow - Votre Facture N° FAC-" + membership.getId());
            helper.setText(buildInvoiceHtml(client, membership), true);

            byte[] pdfBytes = pdfInvoiceService.generateInvoicePdf(client, membership);
            helper.addAttachment(
                "Facture_GymFlow_FAC-" + membership.getId() + ".pdf",
                new ByteArrayResource(pdfBytes),
                "application/pdf"
            );

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Erreur lors de l'envoi de la facture par email", e);
        }
    }

    public void sendPaymentReminderEmail(Client client, Membership membership) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(FROM_EMAIL);
            helper.setTo(client.getEmail());
            helper.setSubject("GymFlow - Votre abonnement expire bientôt !");
            helper.setText(buildReminderHtml(client, membership), true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Erreur lors de l'envoi du rappel", e);
        }
    }

    public void sendBookingConfirmation(Client client, com.happyfitness.erp.model.Course course, java.time.LocalDate date) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(FROM_EMAIL);
            helper.setTo(client.getEmail());
            helper.setSubject("GymFlow - Confirmation de votre réservation");
            helper.setText(buildBookingConfirmationHtml(client, course, date), true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Erreur lors de l'envoi de la confirmation de réservation", e);
        }
    }

    // ============================
    // HTML TEMPLATES (using String concatenation to avoid % issues)
    // ============================

    private String buildVerificationHtml(String clientName, String code) {
        return "<!DOCTYPE html>"
            + "<html><body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>"
            + "<div style='max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);'>"
            + "  <div style='background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;'>"
            + "    <h1 style='color: #FFCC00; margin: 0; font-size: 28px;'>GymFlow</h1>"
            + "    <p style='color: #ccc; margin: 5px 0 0 0; font-size: 12px;'>Votre salle de sport préférée</p>"
            + "  </div>"
            + "  <div style='padding: 30px; text-align: center;'>"
            + "    <h2 style='color: #333; margin-bottom: 10px;'>Bienvenue, " + clientName + " ! 🎉</h2>"
            + "    <p style='color: #666; font-size: 14px;'>Voici votre code de vérification :</p>"
            + "    <div style='background: #1a1a1a; color: #FFCC00; font-size: 36px; font-weight: bold; letter-spacing: 12px; padding: 20px; border-radius: 8px; margin: 20px 0;'>"
            + "      " + code
            + "    </div>"
            + "    <p style='color: #999; font-size: 12px;'>Ce code est valable pendant 10 minutes.<br>Si vous n'avez pas demandé ce code, ignorez cet email.</p>"
            + "  </div>"
            + "  <div style='background: #f9f9f9; padding: 15px; text-align: center; font-size: 11px; color: #aaa;'>"
            + "    &copy; 2026 GymFlow - Tous droits réservés"
            + "  </div>"
            + "</div>"
            + "</body></html>";
    }

    private String buildInvoiceHtml(Client client, Membership membership) {
        String dateDebut = membership.getDateDebut().format(DATE_FMT);
        String dateFin = membership.getDateFin().format(DATE_FMT);
        String montant = String.format("%.2f", membership.getPrixPaye());

        return "<!DOCTYPE html>"
            + "<html><body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>"
            + "<div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);'>"
            + "  <div style='background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;'>"
            + "    <h1 style='color: #FFCC00; margin: 0; font-size: 28px;'>GymFlow</h1>"
            + "    <p style='color: #ccc; margin: 5px 0 0 0;'>Facture N&deg; FAC-" + membership.getId() + "</p>"
            + "  </div>"
            + "  <div style='padding: 30px;'>"
            + "    <h2 style='color: #333;'>Merci pour votre paiement ! ✅</h2>"
            + "    <p style='color: #666;'>Bonjour <strong>" + client.getNomComplet() + "</strong>,</p>"
            + "    <p style='color: #666;'>Votre abonnement a été validé avec succès. Voici le récapitulatif :</p>"
            + "    <table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>"
            + "      <tr style='background: #f5f5f5;'>"
            + "        <td style='padding: 12px; border: 1px solid #eee; font-weight: bold;'>Type d'abonnement</td>"
            + "        <td style='padding: 12px; border: 1px solid #eee;'>" + membership.getTypeAbonnement() + "</td>"
            + "      </tr>"
            + "      <tr>"
            + "        <td style='padding: 12px; border: 1px solid #eee; font-weight: bold;'>Date de début</td>"
            + "        <td style='padding: 12px; border: 1px solid #eee;'>" + dateDebut + "</td>"
            + "      </tr>"
            + "      <tr style='background: #f5f5f5;'>"
            + "        <td style='padding: 12px; border: 1px solid #eee; font-weight: bold;'>Date d'expiration</td>"
            + "        <td style='padding: 12px; border: 1px solid #eee;'>" + dateFin + "</td>"
            + "      </tr>"
            + "      <tr>"
            + "        <td style='padding: 12px; border: 1px solid #eee; font-weight: bold; font-size: 18px;'>Total Payé</td>"
            + "        <td style='padding: 12px; border: 1px solid #eee; font-weight: bold; font-size: 18px; color: #28a745;'>" + montant + " DH</td>"
            + "      </tr>"
            + "    </table>"
            + "    <p style='color: #999; font-size: 12px;'>La facture PDF est jointe à cet email. Conservez-la comme justificatif de paiement.</p>"
            + "  </div>"
            + "  <div style='background: #f9f9f9; padding: 15px; text-align: center; font-size: 11px; color: #aaa;'>"
            + "    &copy; 2026 GymFlow - 123 Avenue du Sport, Casablanca<br>Tél : 05 22 00 00 00"
            + "  </div>"
            + "</div>"
            + "</body></html>";
    }

    private String buildReminderHtml(Client client, Membership membership) {
        String dateFin = membership.getDateFin().format(DATE_FMT);

        return "<!DOCTYPE html>"
            + "<html><body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>"
            + "<div style='max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);'>"
            + "  <div style='background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;'>"
            + "    <h1 style='color: #FFCC00; margin: 0; font-size: 28px;'>GymFlow</h1>"
            + "  </div>"
            + "  <div style='padding: 30px; text-align: center;'>"
            + "    <h2 style='color: #e67e22;'>⏰ Votre abonnement expire bientôt !</h2>"
            + "    <p style='color: #666;'>Bonjour <strong>" + client.getNomComplet() + "</strong>,</p>"
            + "    <p style='color: #666;'>Votre abonnement <strong>" + membership.getTypeAbonnement() + "</strong> expire le <strong style='color: #e74c3c;'>" + dateFin + "</strong>.</p>"
            + "    <p style='color: #666;'>Rendez-vous à la réception de GymFlow pour le renouveler !</p>"
            + "    <div style='margin: 30px 0;'>"
            + "      <a href='#' style='background: linear-gradient(135deg, #FFCC00 0%, #E6B800 100%); color: #000; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;'>Renouveler Mon Abonnement</a>"
            + "    </div>"
            + "  </div>"
            + "  <div style='background: #f9f9f9; padding: 15px; text-align: center; font-size: 11px; color: #aaa;'>"
            + "    &copy; 2026 GymFlow - Tous droits réservés"
            + "  </div>"
            + "</div>"
            + "</body></html>";
    }

    private String buildBookingConfirmationHtml(Client client, com.happyfitness.erp.model.Course course, java.time.LocalDate date) {
        String formattedDate = date.format(DATE_FMT);
        String heureDebut = course.getHeureDebut().substring(0, 5);
        String heureFin = course.getHeureFin().substring(0, 5);

        return "<!DOCTYPE html>"
            + "<html><body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>"
            + "<div style='max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);'>"
            + "  <div style='background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;'>"
            + "    <h1 style='color: #FFCC00; margin: 0; font-size: 28px;'>GymFlow</h1>"
            + "  </div>"
            + "  <div style='padding: 30px; text-align: center;'>"
            + "    <h2 style='color: #28a745;'>✅ Réservation confirmée !</h2>"
            + "    <p style='color: #666;'>Bonjour <strong>" + client.getNomComplet() + "</strong>,</p>"
            + "    <p style='color: #666;'>Votre place pour le cours de <strong>" + course.getNom() + "</strong> est réservée.</p>"
            + "    <div style='background: #f9f9f9; border-left: 4px solid #FFCC00; padding: 15px; margin: 20px 0; text-align: left;'>"
            + "      <p style='margin: 5px 0;'>📅 Date : <strong>" + formattedDate + "</strong></p>"
            + "      <p style='margin: 5px 0;'>⏰ Heure : <strong>" + heureDebut + " - " + heureFin + "</strong></p>"
            + "      <p style='margin: 5px 0;'>📍 Salle : <strong>" + (course.getSalle() != null ? course.getSalle() : "Principale") + "</strong></p>"
            + "      <p style='margin: 5px 0;'>🏋️ Coach : <strong>" + course.getCoach() + "</strong></p>"
            + "    </div>"
            + "    <p style='color: #999; font-size: 13px;'>N'oubliez pas votre serviette et bouteille d'eau !</p>"
            + "  </div>"
            + "  <div style='background: #f9f9f9; padding: 15px; text-align: center; font-size: 11px; color: #aaa;'>"
            + "    &copy; 2026 GymFlow - Tous droits réservés"
            + "  </div>"
            + "</div>"
            + "</body></html>";
    }
}
