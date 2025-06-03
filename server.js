// server.js
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const transporter = nodemailer.createTransport({
    service: 'gmail', // أو 'outlook', 'smtp'
    auth: {
        user: process.env.EMAIL_USER, // بريدك الإلكتروني (من .env)
        pass: process.env.EMAIL_PASS  // كلمة مرور التطبيق (من .env)
    }
});

app.post('/submit-booking', async (req, res) => {
    const { fullName, email, phone, numParticipants, participants, arrivalDate, notes, totalPrice } = req.body;

    // التحقق من البيانات الأساسية
    if (!fullName || !email || !phone || !numParticipants || !participants || !Array.isArray(participants) || !arrivalDate || !totalPrice) {
        return res.status(400).send('الرجاء تعبئة جميع الحقول المطلوبة بشكل صحيح.');
    }

    // التحقق من الأعمار والجنسيات لكل مشارك على الخادم لضمان أمان البيانات
    for (const p of participants) {
        const age = parseInt(p.age);
        if (isNaN(age) || age < 18 || age > 45) {
            return res.status(400).send(`عذراً، عمر أحد المشاركين غير مقبول (${p.age}). يجب أن يكون العمر بين 18 و 45 سنة.`);
        }
        if (!p.gender || (p.gender !== 'male' && p.gender !== 'female')) {
            return res.status(400).send('الرجاء تحديد جنس كل مشارك.');
        }
        if (!p.nationality || p.nationality.trim() === '') {
            return res.status(400).send('الرجاء تحديد جنسية كل مشارك.');
        }
    }

    // بناء تفاصيل المشاركين للايميل
    let participantsDetails = participants.map((p, index) => `
        <li>المشارك ${index + 1}: العمر: ${p.age}، الجنس: ${p.gender === 'male' ? 'ذكر' : 'أنثى'}، الجنسية: ${p.nationality}</li>
    `).join('');


    // رسالة الإيميل إليك (الإدارة)
    const mailToAdminOptions = {
        from: process.env.EMAIL_USER,
        to: 'unitedhr8@gmail.com', // ايميلك لاستقبال الحجوزات
        subject: `طلب حجز جديد لمخيم شيلا من ${fullName}`,
        html: `
            <h2>تفاصيل الحجز الجديد:</h2>
            <p><strong>الاسم الكامل:</strong> ${fullName}</p>
            <p><strong>البريد الإلكتروني:</strong> ${email}</p>
            <p><strong>رقم الهاتف:</strong> ${phone}</p>
            <p><strong>عدد المشاركين:</strong> ${numParticipants}</p>
            <h3>تفاصيل المشاركين:</h3>
            <ul>
                ${participantsDetails}
            </ul>
            <p><strong>تاريخ بدء المخيم:</strong> ${arrivalDate}</p>
            <p><strong>المبلغ الإجمالي المطلوب:</strong> ${totalPrice} USD</p>
            <p><strong>ملاحظات:</strong> ${notes || 'لا توجد'}</p>
            <hr>
            <p>تم إرسال هذا الطلب في: ${new Date().toLocaleString('ar-AE')}</p>
        `
    };

    // رسالة الإيميل للعميل
    const mailToClientOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'تأكيد حجزك في مخيم استكشف شيلا!',
        html: `
            <h2>مرحباً ${fullName},</h2>
            <p>نشكرك على حجزك في مخيم "استكشف شيلا". يسعدنا انضمامك إلينا في مغامرة لا تُنسى!</p>
            <p>تأكيداً لحجزك، يرجى إتمام عملية الدفع للمبلغ الإجمالي: <strong>${totalPrice} USD</strong>.</p>
            <p>يمكنك مراجعة تفاصيل الدفع في صفحة الحجز التي قمت بزيارتها، أو التواصل معنا على الرقم +90 545 730 7235.</p>
            <h3>تفاصيل حجزك:</h3>
            <ul>
                <li><strong>تاريخ بدء المخيم:</strong> 15/07/2025</li>
                <li><strong>عدد المشاركين:</strong> ${numParticipants}</li>
                <li><strong>المبلغ الإجمالي المطلوب:</strong> ${totalPrice} USD</li>
            </ul>
            <h3>سياسة الاسترداد:</h3>
            <ul>
                <li>في حال الإلغاء قبل <strong>7 أيام</strong> من تاريخ بدء المخيم، يتم استرداد <strong>80%</strong> من قيمة المبلغ المدفوع.</li>
                <li>في حال الإلغاء قبل <strong>3 أيام</strong> من تاريخ بدء المخيم، يتم استرداد <strong>70%</strong> من قيمة المبلغ المدفوع.</li>
                <li>في حال الإلغاء قبل <strong>24 ساعة</strong> أو أقل من تاريخ بدء المخيم، <strong>لا يتم استرداد أي مبلغ</strong>.</li>
            </ul>
            <p>آخر موعد للتسجيل والدفع هو 10/07/2025.</p>
            <p>للمزيد من المعلومات، يرجى زيارة <a href="http://www.yourwebsite.com/index.html#terms">الشروط والأحكام</a> (تذكر استبدال http://www.yourwebsite.com برابط موقعك الفعلي).</p>
            <p>نتطلع لرؤيتك قريباً في شيلا!</p>
            <p>مع تحيات,<br>فريق Istanova</p>
        `
    };

    try {
        await transporter.sendMail(mailToAdminOptions);
        await transporter.sendMail(mailToClientOptions);
        console.log(`Booking from ${fullName} received and emails sent.`);
        res.status(200).send('تم إرسال طلب الحجز بنجاح. تحقق من بريدك الإلكتروني لتأكيد الحجز!');
    } catch (error) {
        console.error('فشل إرسال البريد الإلكتروني:', error);
        res.status(500).send('حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.');
    }
});

// تشغيل الخادم
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});