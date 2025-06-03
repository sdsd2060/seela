// ملف script.js
document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('bookingForm');
    const numParticipantsInput = document.getElementById('numParticipants');
    const participantFieldsContainer = document.getElementById('participantFieldsContainer');
    const phoneInputField = document.getElementById('phone');

    // 1. تهيئة حقل رقم الهاتف باستخدام intl-tel-input
    // هذا الجزء يقوم بإنشاء حقل الهاتف مع قائمة منسدلة للأعلام ورموز الدول
    const iti = window.intlTelInput(phoneInputField, {
        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/18.2.1/js/utils.js", // ضروري لتحويل الأرقام وتنسيقها
        initialCountry: "auto", // الكشف التلقائي عن الدولة (قد يعتمد على IP)
        geoIpLookup: function(callback) {
            // هذا الجزء اختياري: يحاول الكشف عن موقع المستخدم باستخدام خدمة IP
            // إذا كنت لا تريد استخدام خدمة خارجية، يمكنك إزالة هذا الجزء
            // أو تعيين initialCountry لدولة افتراضية مثل "sa"
            fetch("https://ipinfo.io/json?token=YOUR_TOKEN", { // **تنبيه: استبدل YOUR_TOKEN برمز خاص بك من ipinfo.io**
                headers: { "Accept": "application/json" }
            })
            .then(res => res.json())
            .then(data => callback(data.country))
            .catch(() => callback("sa")); // fallback to Saudi Arabia if IP lookup fails
        },
        preferredCountries: ["sa", "ae", "eg", "jo", "kw", "qa", "bh", "om"], // دول مفضلة تظهر في الأعلى
        formatOnDisplay: true, // تنسيق الرقم أثناء الكتابة
        separateDialCode: true, // فصل رمز الدولة عن الرقم
    });

    // دالة لتوليد حقول المشاركين ديناميكيًا
    function generateParticipantFields() {
        const numParticipants = parseInt(numParticipantsInput.value);
        participantFieldsContainer.innerHTML = ''; // مسح الحقول الموجودة قبل إعادة إنشائها

        // إذا كان هناك مشارك واحد فقط، فلن نستخدم ترقيم
        if (numParticipants === 1) {
            const participantBlock = document.createElement('div');
            participantBlock.classList.add('participant-block');
            participantBlock.innerHTML = `
                <h3>معلومات المشارك</h3>
                <div class="form-group">
                    <label for="participant1Name">اسم المشارك (الاسم الكامل):</label>
                    <input type="text" id="participant1Name" name="participant1Name" required>
                </div>
                <div class="form-group">
                    <label for="participant1Age">عمر المشارك:</label>
                    <input type="number" id="participant1Age" name="participant1Age" min="1" required>
                </div>
                <div class="form-group">
                    <label for="participant1Nationality">جنسية المشارك:</label>
                    <input type="text" id="participant1Nationality" name="participant1Nationality" required>
                </div>
            `;
            participantFieldsContainer.appendChild(participantBlock);
        } else {
            // إذا كان هناك أكثر من مشارك، سنستخدم ترقيم
            for (let i = 0; i < numParticipants; i++) {
                const participantIndex = i + 1; // للترقيم (يبدأ من 1)
                const participantBlock = document.createElement('div');
                participantBlock.classList.add('participant-block');
                participantBlock.innerHTML = `
                    <h3>معلومات المشارك ${participantIndex}</h3>
                    <div class="form-group">
                        <label for="participant${participantIndex}Name">اسم المشارك ${participantIndex} (الاسم الكامل):</label>
                        <input type="text" id="participant${participantIndex}Name" name="participant${participantIndex}Name" required>
                    </div>
                    <div class="form-group">
                        <label for="participant${participantIndex}Age">عمر المشارك ${participantIndex}:</label>
                        <input type="number" id="participant${participantIndex}Age" name="participant${participantIndex}Age" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="participant${participantIndex}Nationality">جنسية المشارك ${participantIndex}:</label>
                        <input type="text" id="participant${participantIndex}Nationality" name="participant${participantIndex}Nationality" required>
                    </div>
                `;
                participantFieldsContainer.appendChild(participantBlock);
            }
        }
    }

    // استدعاء الدالة عند تحميل الصفحة لأول مرة لإنشاء حقول المشارك الافتراضي (1)
    generateParticipantFields();

    // إضافة مستمع حدث لتغيير عدد المشاركين
    numParticipantsInput.addEventListener('change', generateParticipantFields);

    // معالجة إرسال النموذج
    bookingForm.addEventListener('submit', (event) => {
        event.preventDefault(); // منع الإرسال الافتراضي للصفحة

        // التحقق من صحة رقم الهاتف باستخدام intl-tel-input
        if (!iti.isValidNumber()) {
            alert('يرجى إدخال رقم هاتف صحيح وصالح.');
            phoneInputField.focus();
            return; // إيقاف الإرسال إذا كان الرقم غير صالح
        }

        // جمع البيانات من النموذج
        const formData = {
            mainBooker: {
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                // الحصول على الرقم بالتنسيق الدولي من intl-tel-input
                phone: iti.getNumber(), 
            },
            tourDetails: {
                tourDate: document.getElementById('tourDate').value,
                numParticipants: parseInt(numParticipantsInput.value),
                notes: document.getElementById('notes').value,
            },
            participants: []
        };

        // جمع بيانات كل المشاركين
        const numParticipants = parseInt(numParticipantsInput.value);
        for (let i = 0; i < numParticipants; i++) {
            const participantIndex = i + 1;
            formData.participants.push({
                name: document.getElementById(`participant${participantIndex}Name`).value,
                age: parseInt(document.getElementById(`participant${participantIndex}Age`).value),
                nationality: document.getElementById(`participant${participantIndex}Nationality`).value
            });
        }

        console.log('بيانات الحجز المجمعة:', formData);

        // **هنا يمكنك إرسال formData إلى خادم الويب الخاص بك.**
        // يمكنك استخدام Fetch API أو XMLHttpRequest لإرسال البيانات.
        // مثال (معطل حاليًا، فقط للتوضيح):
        /*
        fetch('/api/submit-booking', { // استبدل بمسار API الخاص بك
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        })
        .then(response => response.json())
        .then(data => {
            console.log('تم الإرسال بنجاح:', data);
            alert('تم إرسال حجزك بنجاح! سنتواصل معك قريباً.');
            bookingForm.reset(); // إعادة تعيين النموذج بعد الإرسال الناجح
            generateParticipantFields(); // إعادة توليد حقول المشاركين بعد إعادة التعيين
        })
        .catch((error) => {
            console.error('خطأ في الإرسال:', error);
            alert('حدث خطأ أثناء إرسال الحجز. يرجى المحاولة مرة أخرى.');
        });
        */

        // رسالة نجاح مؤقتة (للتجريب فقط)
        alert('تم إرسال حجزك بنجاح! (البيانات في Console)');
        bookingForm.reset(); // إعادة تعيين النموذج
        generateParticipantFields(); // إعادة توليد حقول المشاركين بعد إعادة التعيين
    });
});