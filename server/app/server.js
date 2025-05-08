const express = require("express");
const bodyParser = require("body-parser");
const pdf = require("html-pdf");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("views"));

// Serve the form
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "form.html"));
});

// Generate PDF endpoint
app.post("/generate-pdf", (req, res) => {
  const formData = req.body;

  // Generate HTML with form data
  const html = generatePdfHtml(formData);

  // PDF options
  const options = {
    format: "A4",
    border: {
      top: "20mm",
      right: "20mm",
      bottom: "20mm",
      left: "20mm",
    },
    type: "pdf",
    timeout: 60000,
  };

  // Create PDF
  pdf.create(html, options).toBuffer((err, buffer) => {
    if (err) {
      console.error("PDF generation error:", err);
      return res.status(500).json({ error: err.message });
    }

    // Save PDF to server
    const filename = `PeerReview_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, "pdfs", filename);

    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        console.error("Error saving PDF:", err);
      } else {
        console.log("PDF saved:", filename);
      }
    });

    // Send PDF to client
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send(buffer);
  });
});

function generatePdfHtml(data) {
  // Format dates for display
  const startDate = data.reviewStartDate
    ? new Date(data.reviewStartDate).toLocaleDateString()
    : "";
  const endDate = data.reviewEndDate
    ? new Date(data.reviewEndDate).toLocaleDateString()
    : "";

  // Generate checked options
  const checkedReasons = {
    mandatory: data.applyReason?.includes("mandatory") ? "✓" : "☐",
    voluntary: data.applyReason?.includes("voluntary") ? "✓" : "☐",
    specialCase: data.applyReason?.includes("specialCase") ? "✓" : "☐",
    newUnit: data.applyReason?.includes("newUnit") ? "✓" : "☐",
    boardDecision: data.applyReason?.includes("boardDecision") ? "✓" : "☐",
  };

  const checkedOptions = {
    sameCity: data.reviewerOption?.includes("sameCity") ? "✓" : "☐",
    outsideCity: data.reviewerOption?.includes("outsideCity") ? "✓" : "☐",
    either: data.reviewerOption?.includes("either") ? "✓" : "☐",
    preferredCity: data.reviewerOption?.includes("preferredCity") ? "✓" : "☐",
  };

  // Generate the complete HTML with data
  return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: "Arial Narrow", sans-serif;
                    font-size: 15px;
                    line-height: 13.5pt;
                    margin: 0;
                    padding: 20px;
                }
                .text-center {
                    text-align: center;
                }
                .text-justify {
                    text-align: justify;
                }
                .form-title {
                    margin-top: 4.9pt;
                    margin-bottom: 6.0pt;
                    margin-left: 12.3pt;
                    text-indent: -12.3pt;
                }
                .underline {
                    text-decoration: underline;
                }
                table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 10px 0;
                }
                table, th, td {
                    border: 1px solid black;
                }
                th, td {
                    padding: 5px;
                    vertical-align: top;
                }
                th {
                    background-color: #d9d9d9;
                    text-align: center;
                }
                .dotted-field {
                    border-bottom: 1px dotted black;
                    min-width: 200px;
                    display: inline-block;
                }
                ol {
                    padding-left: 20px;
                }
                ol.lower-roman {
                    list-style-type: lower-roman;
                }
                .checkbox {
                    font-family: "Arial Unicode MS";
                }
            </style>
        </head>
        <body>
            <div style="max-width: 800px; margin: 0 auto;">
                <p class="form-title"><strong>FORM 1</strong></p>
                <p class="text-center"><strong>APPLICATION CUM QUESTIONNAIRE TO BE SUBMITTED BY<br>PRACTICE UNIT</strong></p>
                <p class="text-center"><strong>[<em>As per</em> <em>Clause 6(1) &amp; 6 (2) of the Peer Review Guidelines 2022]</em></strong></p>
                <p><strong>&nbsp;</strong></p>
                <p><strong>The Secretary, Peer Review Board,</strong></p>
                <p><strong>The Institute of Chartered Accountants of India,&nbsp;</strong></p>
                <p><strong>ICAI Bhawan,</strong></p>
                <p><strong>Post Box No. 7100,</strong></p>
                <p><strong>Indraprastha Marg, New Delhi – 110002&nbsp;</strong></p>
                <p><strong>&nbsp;</strong></p>
                <p class="text-center"><strong>APPLICATION</strong></p>
                <p class="text-center"><strong>&nbsp;</strong></p>
                <p>Dear Sir,</p>
                <p class="text-center"><strong><s><span style="text-decoration:none;">&nbsp;</span></s></strong></p>
                
                <ol>
                    <li>Our Firm <span class="dotted-field">${
                      data.firmName || ""
                    }</span> ; FRN/ M. No <span class="dotted-field">${
    data.firmRegNumber || ""
  }</span> would like to apply for Peer Review for the period from <span class="dotted-field">${startDate}</span> to <span class="dotted-field">${endDate}</span> (three preceding financial years from the date of application). We have gone through the Peer Review Guidelines 2022 hosted at <a href="https://resource.cdn.icai.org/72010prb57960-peer-review-guidelines2022.pdf">https://resource.cdn.icai.org/72010prb57960-peer-review-guidelines2022.pdf</a> and undertake to abide by the same.</li>
                    
                    <li>I/We hereby declare that my/our firm is applying for Peer Review (Tick the applicable clause):
                        <ol class="lower-roman">
                            <li><span class="checkbox">${
                              checkedReasons.mandatory
                            }</span> As it is Mandatory by: ICAI Any other Regulator (please specify) <span class="dotted-field">${
    data.otherRegulator || ""
  }</span></li>
                            <li><span class="checkbox">${
                              checkedReasons.voluntary
                            }</span> Voluntarily:</li>
                            <li><span class="checkbox">${
                              checkedReasons.specialCase
                            }</span> As a special case Review initiated by the Board:</li>
                            <li><span class="checkbox">${
                              checkedReasons.newUnit
                            }</span> New Unit:</li>
                            <li><span class="checkbox">${
                              checkedReasons.boardDecision
                            }</span> As per decision of the Board:</li>
                        </ol>
                    </li>
                    
                    <li>I/We hereby declare that my/our firm has signed reports pertaining to the following assurance services during the period under review:</li>
                </ol>
                
                <table>
                    <tr>
                        <th>S. No.</th>
                        <th>Type of Assurance service rendered</th>
                        <th>Major type of Client <u>(please specify)</u> (e.g.: Banks; Insurance Company; Manufacturing; Individuals; Trading ; any other )</th>
                    </tr>
                    <tr>
                        <td>1</td>
                        <td>Central Statutory Audit</td>
                        <td>${data.clientType1 || ""}</td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td>Statutory Audit</td>
                        <td>${data.clientType2 || ""}</td>
                    </tr>
                    <tr>
                        <td>3</td>
                        <td>Internal Audit</td>
                        <td>${data.clientType3 || ""}</td>
                    </tr>
                    <tr>
                        <td>4</td>
                        <td>Tax Audit</td>
                        <td>${data.clientType4 || ""}</td>
                    </tr>
                    <tr>
                        <td>5</td>
                        <td>Concurrent Audit</td>
                        <td>${data.clientType5 || ""}</td>
                    </tr>
                    <tr>
                        <td>6</td>
                        <td>Certification work</td>
                        <td>${data.clientType6 || ""}</td>
                    </tr>
                    <tr>
                        <td>7</td>
                        <td>Any other, please specify ${
                          data.otherService || ""
                        }</td>
                        <td>${data.clientType7 || ""}</td>
                    </tr>
                </table>
                
                <ol start="4">
                    <li>I / We hereby declare that my/ our firm 
                        <span class="checkbox">${
                          data.hasConducted === "yes" ? "✓" : "☐"
                        }</span> has conducted 
                        <span class="checkbox">${
                          data.hasConducted === "no" ? "✓" : "☐"
                        }</span> has not conducted 
                        Statutory Audit of enterprises Listed in India or abroad as defined under SEBI LODR, 2015 during the Review Period.</li>
                    
                    <li>Option for appointment of Reviewer: (Tick appropriate option)
                        <ol class="lower-roman">
                            <li><span class="checkbox">${
                              checkedOptions.sameCity
                            }</span> Same City</li>
                            <li><span class="checkbox">${
                              checkedOptions.outsideCity
                            }</span> From outside City</li>
                            <li><span class="checkbox">${
                              checkedOptions.either
                            }</span> Either option (i) or (ii)</li>
                            <li><span class="checkbox">${
                              checkedOptions.preferredCity
                            }</span> Preferred City in case of option (ii) ${
    data.preferredCity || ""
  }</li>
                        </ol>
                    </li>
                    
                    <li>Mail Id for communication with the Practice unit <span class="dotted-field">${
                      data.communicationEmail || ""
                    }</span></li>
                    
                    <li>Address for sending the Peer Review Certificate<br>
                        ${
                          data.certificateAddress
                            ? data.certificateAddress.replace(/\n/g, "<br>")
                            : ""
                        }
                    </li>
                </ol>
                
                <p style="text-align: center; text-decoration: underline; margin-top: 20px;"><strong>Further Information to be submitted by New Unit</strong></p>
            </div>
        </body>
        </html>
    `;
}

// Create pdfs directory if it doesn't exist
const pdfDir = path.join(__dirname, "pdfs");
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir);
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
