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

  // Generate HTML with form data for both pages
  const html = generateCompletePdfHtml(formData);

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

function generateCompletePdfHtml(data) {
  console.log(data);
  // Format dates for display
  const startDate = data.reviewStartDate
    ? new Date(data.reviewStartDate).toLocaleDateString()
    : "";
  const endDate = data.reviewEndDate
    ? new Date(data.reviewEndDate).toLocaleDateString()
    : "";
  const declarationDate = data.declarationDate
    ? new Date(data.declarationDate).toLocaleDateString()
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

  //   Page No 6
  const establishmentDate = data.establishmentDate
    ? new Date(data.establishmentDate).toLocaleDateString()
    : "";

  const reviewFrom = data.reviewFrom
    ? new Date(data.reviewFrom).toLocaleDateString()
    : "";

  const reviewTo = data.reviewTo
    ? new Date(data.reviewTo).toLocaleDateString()
    : "";
  const statusValue = data.status || [];
  const statusArray = Array.isArray(statusValue) ? statusValue : [statusValue];
  const statusChecks = {
    partnership: statusArray.includes("Partnership") ? "✓" : "☐",
    proprietorship: statusArray.includes("Proprietorship") ? "✓" : "☐",
    llp: statusArray.includes("Limited Liability Partnership") ? "✓" : "☐",
    individual: statusArray.includes("Practicing in individual name")
      ? "✓"
      : "☐",
  };

  // Networking details

  const networkSinceDate = data.networkSince
    ? new Date(data.networkSince).toLocaleDateString()
    : "";
  const networkingDetails = `
    <div style="margin-top: 10px;">
      <p>(i) Name of network: <span class="dotted-field">${
        data.networkName || ""
      }</span></p>
      <p>(ii) Since when the Networking is entered into: <span class="dotted-field">${networkSinceDate}</span></p>
      <p>(iii) Is there any exit from the Networking recently: 
        <span>${data.hasExit === "yes" ? "Yes" : "No"}</span>
      </p>
      <p>Reason for such exit: <span class="dotted-field">${
        data.reasonForExit || ""
      }</span></p>
    </div>
  `;

  const signatureDate =
    data.signature_date || new Date().toISOString().split("T")[0];

  //form no 8

  //function generateCompletePdfHtml(data) {
  // Format dates for display
  const selfEvalDate = data.self_evaluation_date
    ? new Date(data.self_evaluation_date).toLocaleDateString()
    : "";

  //Form no 9
  const formatCell = (value) => value || "&nbsp;";

  //Form no 10
  function generateEntityRows(data, prefix, count) {
    let rows = "";

    for (let i = 1; i <= count; i++) {
      rows += `
      <tr>
        <td style="width:6.4%;">${prefix.charAt(0).toUpperCase()}${i}</td>
        <td style="width:10.7%;"><span class="input-value">${
          data[`${prefix}_name${i}`] || ""
        }</span></td>
        <td style="width:7.72%;"><span class="input-value">${
          data[`${prefix}_engagement${i}`] || ""
        }</span></td>
        <td style="width:7.52%;"><span class="input-value">${
          data[`${prefix}_type${i}`] || ""
        }</span></td>
        <td style="width:7.92%;"><span class="input-value">${
          data[`${prefix}_fees${i}`] || ""
        }</span></td>
        <td style="width:9.5%;"><span class="input-value">${
          data[`${prefix}_remarks${i}`] || ""
        }</span></td>
        <td style="width:9.52%;"><span class="input-value">${
          data[`${prefix}_col6_${i}`] || ""
        }</span></td>
        <td style="width:13.82%;"><span class="input-value">${
          data[`${prefix}_col7_${i}`] || ""
        }</span></td>
        <td style="width:8.42%;"><span class="input-value">${
          data[`${prefix}_col8_${i}`] || ""
        }</span></td>
        <td style="width:10.86%;"><span class="input-value">${
          data[`${prefix}_col9_${i}`] || ""
        }</span></td>
        <td style="width:7.62%;"><span class="input-value">${
          data[`${prefix}_col10_${i}`] || ""
        }</span></td>
      </tr>
    `;
    }

    return rows;
  }

  //   Page No 26
  // Helper function to get radio button value
  const getRadioValue = (name) => {
    return data[name] === "yes" ? "YES" : data[name] === "no" ? "NO" : "N/A";
  };

  // Page No 30
  // Helper function to get display value for YES/NO/NA fields
  const getDisplayValue = (value) => {
    if (!value) return "";
    return value === "YES" ? "YES" : value === "NO" ? "NO" : "N/A";
  };

  //   Form No 31
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  // Generate the complete HTML with both pages

  //Page no 32
  // Generate checked options
  const generateCheckbox = (value) => (value ? "✓" : "☐");

  // QC monitoring responses
  const qcResponses = {};
  for (let i = 1; i <= 9; i++) {
    const key = `qc_monitoring_${i === 9 ? "ix" : "i".repeat(i)}`;
    qcResponses[key] = data[key] || "";
  }

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
            .form-container {
                max-width: 800px;
                margin: 0 auto;
            }
            .text-center {
                text-align: center;
            }
            .text-justify {
                text-align: justify;
            }
            .form-title {
                margin-top: 4.9pt;
                margin-bottom: 6pt;
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
            .dotted-field1 {
                border-bottom: 1px dotted black;
                min-width: 50px;
                display: inline-block;
            }
            .dotted-field2 {
                border-bottom: 1px dotted black;
                min-width: 80px;
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
            textarea {
                width: 100%;
                border: 1px solid black;
                font-family: Arial Narrow;
                font-size: 15px;
            }
            .declaration-section {
                margin-top: 30px;
            }
            .signature-section {
                margin-top: 50px;
            }
            .yes-no-table {
                width: 50px;
                float: right;
                margin-top: 40px;
                
            }
            .page-break {
                page-break-before: always;
                margin-top: 50px;
            }
        </style>
        <style>
            body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.5;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
            }
            h1 {
                text-align: center;
                font-size: 16px;
                margin-bottom: 10px;
            }
            h1:first-child {
                margin-top: 0;
            }
            .section {
                margin-bottom: 20px;
            }
            .form-group {
                margin-bottom: 10px;
            }
            label {
                font-weight: bold;
            }
            .dotted-field {
                border-bottom: 1px dotted #000;
                min-width: 300px;
                display: inline-block;
                padding-bottom: 2px;
                margin-left: 5px;
            }
            .checkbox {
                font-family: "Arial Unicode MS";
                margin-right: 5px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
            }
            table, th, td {
                border: 1px solid #000;
            }
            th, td {
                padding: 5px;
                text-align: left;
            }
            .page-break {
                page-break-before: always;
                margin-top: 50px;
            }
        </style>
    </head>
    <body>
        <!-- Page 1 -->
        <div class="form-container">
            <p class="form-title"><strong>FORM 1</strong></p>
            <p class="text-center">
                <strong>APPLICATION CUM QUESTIONNAIRE TO BE SUBMITTED BY<br>PRACTICE UNIT</strong>
            </p>
            <p class="text-center">
                <strong>[<em>As per</em> <em>Clause 6(1) &amp; 6 (2) of the Peer Review Guidelines 2022]</em></strong>
            </p>
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
                <li>
                    Our Firm <span class="dotted-field">${
                      data.firmName || ""
                    }</span> 
                    (Name of practice unit as per ICAI Records); FRN/ M. No <span class="dotted-field1">${
                      data.firmRegNumber || ""
                    }</span> 
                    (Firm Registration Number/ Mem. No.) would like to apply for Peer Review for the period from 
                    <span class="dotted-field2">${startDate}</span> to <span class="dotted-field2">${endDate}</span> 
                    (three preceding financial years from the date of application). We have gone through the Peer Review Guidelines 2022 hosted at 
                    <a href="https://resource.cdn.icai.org/72010prb57960-peer-review-guidelines2022.pdf">
                        https://resource.cdn.icai.org/72010prb57960-peer-review-guidelines2022.pdf
                    </a> 
                    and undertake to abide by the same.
                </li>
                
                <li>
                    I/We hereby declare that my/our firm is applying for Peer Review (Tick the applicable clause):
                    <ol class="lower-roman">
                        <li>
                            <span class="checkbox">${
                              checkedReasons.mandatory
                            }</span> 
                            As it is Mandatory by: ICAI Any other Regulator (please specify) 
                            <span class="dotted-field1">${
                              data.otherRegulator || ""
                            }</span>
                        </li>
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
                
                <li>
    I/We hereby declare that my/our firm has signed reports pertaining 
    <div class="page-break"></div>
    to the following assurance services during the period under review:
</li>
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
                      data.otherService ? "✓" : "☐"
                    }</td>
                    <td>${data.clientType7 || ""}</td>
                </tr>
            </table>
            
            <ol start="4">
                <li>
                    I / We hereby declare that my/ our firm 
                    <span class="checkbox">${
                      data.hasConducted === "yes" ? "✓" : "☐"
                    }</span> has conducted 
                    <span class="checkbox">${
                      data.hasConducted === "no" ? "✓" : "☐"
                    }</span> has not conducted 
                    Statutory Audit of enterprises Listed in India or abroad as defined under SEBI LODR, 2015 during the Review Period.
                </li>
                
                <li>
                    Option for appointment of Reviewer: (Tick appropriate option)
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
                        <li>
                            <span class="checkbox">${
                              checkedOptions.preferredCity
                            }</span> 
                            Preferred City in case of option (ii) <span class="dotted-field1">${
                              data.preferredCity || ""
                            }</span>
                        </li>
                    </ol>
                </li>
                
                <li>
                    Mail Id for communication with the Practice unit 
                    <span class="dotted-field">${
                      data.communicationEmail || ""
                    }</span>
                </li>
                
                <li>
                    Address for sending the Peer Review Certificate<br>
                    <div style="border:1px solid black; padding:5px; min-height:50px;">
                        ${
                          data.certificateAddress
                            ? data.certificateAddress.replace(/\n/g, "<br>")
                            : ""
                        }
                    </div>
                </li>
            </ol>
            
            <p style="text-align: center; text-decoration: underline; margin-top: 20px; border-top: 3px solid black; padding-top: 10px; font-weight: bold;">
                Further Information to be submitted by New Unit
            </p>
              <li>
                    8.	Tick the applicable clause or mention N.A. as the case may be:<br> 
                </li>
        </div>
        
        <!-- Page 2 -->
        <div class="page-break form-container">
            <ol>
                <li>
                    <ul>
                        <li>
                            CA <span class="dotted-field">${
                              data.partnerName1 || ""
                            }</span>, 
                            M.No. [<span class="dotted-field1">${
                              data.memberNumber1 || ""
                            }</span>], 
                            partner of my firm is/was a partner/proprietor of the firm 
                            <span class="dotted-field">${
                              data.firmName1 || ""
                            }</span> (name and FRN of firm as per ICAI records)
                            having a Peer Review Certificate No. (<span class="dotted-field1">${
                              data.certNumber1 || ""
                            }</span>) 
                            that is valid from <span class="dotted-field2">${
                              data.validFrom1 || ""
                            }</span> till <span class="dotted-field2">${
    data.validTill1 || ""
  }</span>.
                        </li>
                        <li>
                            I am/was a partner/proprietor of the firm 
                            <span class="dotted-field">${
                              data.firmName2 || ""
                            }</span>(name and FRN of firm as per ICAI records) 
                            having a Peer Review Certificate No. (<span class="dotted-field1">${
                              data.certNumber2 || ""
                            }</span>) 
                            that is valid from <span class="dotted-field2">${
                              data.validFrom2 || ""
                            }</span> till <span class="dotted-field2">${
    data.validTill2 || ""
  }</span>.
                        </li>
                        <li>
                            CA <span class="dotted-field">${
                              data.employeeName || ""
                            }</span>, 
                            (M.No. <span class="dotted-field1">${
                              data.employeeMemberNumber || ""
                            }</span>), 
                            an employee of my firm who is a Chartered Accountant, is/was a partner/proprietor of the firm 
                            <span class="dotted-field">${
                              data.firmName3 || ""
                            }</span>(name and FRN of firm as per ICAI records) 
                            having a Peer Review Certificate No. (<span class="dotted-field1">${
                              data.certNumber3 || ""
                            }</span>) 
                            that is valid from <span class="dotted-field2">${
                              data.validFrom3 || ""
                            }</span> till <span class="dotted-field2">${
    data.validTill3 || ""
  }</span>.
                        </li>
                        <li>
                            CA <span class="dotted-field">${
                              data.partnerName2 || ""
                            }</span>, 
                            M.No. [<span class="dotted-field1">${
                              data.memberNumber2 || ""
                            }</span>], 
                            partner of my firm <span class="dotted-field">${
                              data.firmName4 || ""
                            }</span>, 
                            is an Empanelled Peer Reviewer who has qualified the test organised by the Board.
                        </li>
                        <li>
                            I, CA <span class="dotted-field">${
                              data.proprietorName || ""
                            }</span>, 
                            M.No. <span class="dotted-field1">${
                              data.proprietorNumber || ""
                            }</span>, 
                            am an Empanelled Peer Reviewer who has qualified the test organised by the Board.
                        </li>
                    </ul>
                    
                    
                    <div style="clear: both;"></div>
                </li>

                <li>
                    <p>Policies, procedures, and infrastructure of my firm are in conformity with the Standards on Quality Control (SQC-1).</p>

                      <table class="yes-no-table" style="width: 50px; border: 1px solid #000; border-collapse: collapse; margin: 10px 0;">
                          <tbody>
                              <tr>
                                  <td style="border: 1px solid #000; padding: 5px; text-align: center;">☑ YES</td>
                              </tr>
                              <tr>
                                  <td style="border: 1px solid #000; padding: 5px; text-align: center;">□ NO</td>
                              </tr>
                          </tbody>
                      </table>
                    
                </li>

                <li>
                    <p>I wish to undertake audit of listed entity and further declare that: (Fill as applicable or else mention N.A.)</p>
                    <ul>
                        <li>
                            CA <span class="dotted-field">${
                              data.listedPartnerName || ""
                            }</span>, 
                            M.No. [<span class="dotted-field1">${
                              data.listedPartnerNumber || ""
                            }</span>], 
                            partner of my firm has carried out audit of Listed company in last three years.
                        </li>
                        <li>
                            I, CA <span class="dotted-field">${
                              data.listedProprietorName || ""
                            }</span>, 
                            M.No. <span class="dotted-field1">${
                              data.listedProprietorNumber || ""
                            }</span> 
                            (in case of proprietorship firm) have carried out audit of Listed company in last three years.
                        </li>
                    </ul>
                </li>

                <li>
                    <p>The Practice Unit nominates its Partner CA <span class="dotted-field">${
                      data.nominatedPartnerName || ""
                    }</span> for Peer Review process. 
                    His Mobile No. is <span class="dotted-field1">${
                      data.nominatedPartnerMobile || ""
                    }</span> 
                    and E-MAIL id is <span class="dotted-field">${
                      data.nominatedPartnerEmail || ""
                    }</span>.</p>
                </li>

                <li>
                    <p>Annexure: Questionnaire</p>
                </li>
            </ol>

            <div class="declaration-section">
                <p>• I hereby Declare that the details furnished above are true and correct</p>

                <p class="page-break"> as borne out by the facts to the best of my knowledge and belief.</p>

                <p>• I understand that the Peer Review Certificate, issued on the basis of the report submitted by the reviewer does not provide immunity from Disciplinary/ legal proceedings or actions initiated against Practice Unit or its partners/ employees. </p>
                <p>•	I undertake to pay the fee to the Peer Reviewer within 7 days from the date of receipt of the invoice from the Peer Reviewer. </p>
                <p>•	I further undertake and agree that the certificate can be revoked for any of the reason stated in the Peer Review Guidelines</p>
            </div>

                    <div class="signature-section" style="line-height: 1.8; padding: 10px 0;">
            <ul style="list-style: none; padding: 0;">
                <li>
                    <strong>Place:</strong> <span class="dotted-field1">${
                      data.place || ""
                    }</span>
                </li>
                <li>
                    <strong>Date:</strong> <span class="dotted-field1">${declarationDate}</span>
                </li>
                <li>
                    <div style="display: flex; justify-content: space-between;">
                        <span><strong>Signature of the Proprietor/Partner</strong></span>
                        <span><strong>Name:</strong> <span class="dotted-field1">${
                          data.signatoryName || ""
                        }</span></span>
                    </div>
                </li>
                <li>
                    <strong>Membership No.:</strong> <span class="dotted-field1">${
                      data.signatoryMemberNumber || ""
                    }</span>
                </li>
            </ul>
        </div>
        <body>
        

        // Page No 5
        <div class="container page-break">
            <h1>Annexure</h1>
            <h1>QUESTIONNAIRE</h1>
            <h1>(PART A - PROFILE OF PRACTICE UNIT (PU))</h1>
            
            <div class="section">
                <div class="form-group">
    <label>1. Name of the Practice Unit:</label>
    <span style="display: block; border: 1px solid #000; padding: 0.5em; margin-top: 0.5em; min-height: 2.5em; width: 100%;">
        ${data.practiceUnitName || ""}
    </span>
</div>

                
                <div class="form-group">
    <label>2. Peer Review of:</label>
    <span style="display: flex; gap: 1em; margin-top: 0.5em;">
        <label>
            <input type="checkbox" ${
              data.reviewType === "HO" ? "checked" : ""
            } disabled />
            HO
        </label>
        <label>
            <input type="checkbox" ${
              data.reviewType === "Branch" ? "checked" : ""
            } disabled />
            Branch
        </label>
        
    </span>
</div>

                <div class="form-group">
                    <label>3. Address (As per ICAI records):</label>
                    <span class="dotted-field">
                    <p>${data.address || ""}</p>
                </div>
                
                <div class="form-group">
                    <label>4. Email ID of PU:</label>
                    <span class="dotted-field">${data.email || ""}</span>
                </div>
                
                <div class="form-group">
                    <label>Website of PU:</label>
                    <span class="dotted-field">${data.website || ""}</span>
                </div>
                
                <div class="form-group">
                    <label>5. Status:</label>
                    <p>
                        <span class="checkbox">${
                          statusChecks.partnership
                        }</span> Partnership &nbsp;
                        <span class="checkbox">${
                          statusChecks.proprietorship
                        }</span> Proprietorship &nbsp;
                        <span class="checkbox">${
                          statusChecks.llp
                        }</span> Limited Liability Partnership &nbsp;
                        <span class="checkbox">${
                          statusChecks.individual
                        }</span> Practicing in individual name
                    </p>
                </div>
                
                <div class="form-group">
                    <label>6. Date of establishment of the PU:</label>
                    <span class="dotted-field">${establishmentDate}</span>
                </div>
                
                <div class="form-group">
                    <label>7. Firm Registration Number:</label>
                    <span class="dotted-field">${
                      data.firmRegNumber || ""
                    }</span>
                    <small>(Membership No. in case of an individual practicing in own name)</small>
                </div>
                
                 <div class="form-group">
                <label>8. Is there any networking firm?</label>
                <span>${data.hasNetworking === "yes" ? "Yes" : "No"}</span>
                ${networkingDetails}
            </div>
                
                <div class="form-group">
                    <label>9. Period of assurance service under review</label>
                    <p>
                        From: <span class="dotted-field">${reviewFrom}</span> 
                        To: <span class="dotted-field">${reviewTo}</span>
                    </p>
                </div>
                
                <div class="form-group">
                 <label>10. Contact person of PU for Peer Review (along with Mobile No. and Email id):</label>
                <div class="dotted-field">
              <p style="white-space: pre-wrap; margin: 0;">${
                data.contactPerson || ""
              }</p>
                </div>
            </div>
      </div>
        </div>

        <div class="form-container page-break">
            <!-- Section 11 -->
            <div class="section-title">
                11. Particulars about the constitution of the PU <strong>during the period under review</strong> (as per <strong>Form 18</strong> filled with the ICAI). Is there assurance service like Statutory audit, tax audit, Taxation etc. headed by different partners, if yes details to be provided in the below table:
            </div>
            
            <table class="partner-table">
                <tbody>
                    <tr>
                        <td rowspan="2" style="width: 5.8%;">Name of sole-practitioner/ sole-proprietor/ partner</td>
                        <td rowspan="2" style="width: 15.5%;">Membership no. of sole-practitioner/ sole-proprietor/ partner</td>
                        <td rowspan="2" style="width: 14.56%;">Association with Practice unit (in years)</td>
                        <td rowspan="2" style="width: 15.68%;">Any Post Qualification or Certificate course pursued within or outside ICAI.</td>
                        <td rowspan="2" style="width: 15.62%;">Professional experience in practice</td>
                        <td rowspan="2" style="width: 16%;">Predominant function (e.g. audit, tax, consulting)</td>
                        <td colspan="2" style="width: 16.82%;">Details of Changes</td>
                    </tr>
                    <tr>
                        <td style="width: 8.62%;">Joined (Year)</td>
                        <td style="width: 8.2%;">Left (Year)</td>
                    </tr>
                    <tr>
                        <td>${data.partner1_name || ""}</td>
                        <td>${data.partner1_membership || ""}</td>
                        <td>${data.partner1_association || ""}</td>
                        <td>${data.partner1_qualification || ""}</td>
                        <td>${data.partner1_experience || ""}</td>
                        <td>${data.partner1_function || ""}</td>
                        <td>${data.partner1_joined || ""}</td>
                        <td>${data.partner1_left || ""}</td>
                    </tr>
                    <tr>
                        <td>${data.partner2_name || ""}</td>
                        <td>${data.partner2_membership || ""}</td>
                        <td>${data.partner2_association || ""}</td>
                        <td>${data.partner2_qualification || ""}</td>
                        <td>${data.partner2_experience || ""}</td>
                        <td>${data.partner2_function || ""}</td>
                        <td>${data.partner2_joined || ""}</td>
                        <td>${data.partner2_left || ""}</td>
                    </tr>
                    <tr>
                        <td>${data.partner3_name || ""}</td>
                        <td>${data.partner3_membership || ""}</td>
                        <td>${data.partner3_association || ""}</td>
                        <td>${data.partner3_qualification || ""}</td>
                        <td>${data.partner3_experience || ""}</td>
                        <td>${data.partner3_function || ""}</td>
                        <td>${data.partner3_joined || ""}</td>
                        <td>${data.partner3_left || ""}</td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Section 12 -->
            <div class="section-title">
                12. Particulars of Chartered Accountants Employed / Paid Assistant or Consultants as on ${
                  data.as_on_date || ""
                } (last date of block period of peer review):
            </div>
            
            <div align="center">
                <table style="width: 397px;">
                    <tbody>
                        <tr>
                            <td style="width: 71.75pt;">Name (s)</td>
                            <td style="width: 73.6pt;">Membership no.</td>
                            <td style="width: 80.7pt;">Association with the practice unit (in years)</td>
                            <td style="width: 70.95pt;">Experience (in years)</td>
                        </tr>
                        <tr>
                            <td>${data.ca1_name || ""}</td>
                            <td>${data.ca1_membership || ""}</td>
                            <td>${data.ca1_association || ""}</td>
                            <td>${data.ca1_experience || ""}</td>
                        </tr>
                        <tr>
                            <td>${data.ca2_name || ""}</td>
                            <td>${data.ca2_membership || ""}</td>
                            <td>${data.ca2_association || ""}</td>
                            <td>${data.ca2_experience || ""}</td>
                        </tr>
                        <tr>
                            <td>${data.ca3_name || ""}</td>
                            <td>${data.ca3_membership || ""}</td>
                            <td>${data.ca3_association || ""}</td>
                            <td>${data.ca3_experience || ""}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Section 13 -->
            <div class="section-title">
                13. Details of Other Employees as on ${
                  data.as_on_date_employees || ""
                } (last date of block period of peer review):
            </div>
            
            <table class="employee-table">
                <tbody>
                    <tr>
                        <td style="width: 63.22%;">Particulars</td>
                        <td style="width: 36.78%;">Number</td>
                    </tr>
                    <tr>
                        <td>(a) Semi-Qualified Assistants</td>
                        <td>${data.semi_qualified || ""}</td>
                    </tr>
                    <tr>
                        <td>(b) Articled Assistants</td>
                        <td>${data.articled_assistants || ""}</td>
                    </tr>
                    <tr>
                        <td>(c) Administrative Staff</td>
                        <td>${data.admin_staff || ""}</td>
                    </tr>
                    <tr>
                        <td>(d) Others</td>
                        <td>${data.other_staff || ""}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section-title page-break">
                14. If the PU has any branch offices, furnish the following details of member in charge and number of staff:
            </div>
            
            <table class="branch-table">
                <tbody>
                    <tr>
                        <td style="width: 10.54%;">S.No</td>
                        <td style="width: 18.08%;">Member in Charge</td>
                        <td style="width: 16.6%;">No. of staff</td>
                        <td style="width: 18.06%;">Membership No</td>
                        <td style="width: 15.06%;">Address</td>
                        <td style="width: 21.64%;">Whether assurance services rendered</td>
                    </tr>
                    <tr>
                        <td>1</td>
                        <td>${data.branch1_member || ""}</td>
                        <td>${data.branch1_staff || ""}</td>
                        <td>${data.branch1_membership || ""}</td>
                        <td>${data.branch1_address || ""}</td>
                        <td>${data.branch1_assurance || ""}</td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td>${data.branch2_member || ""}</td>
                        <td>${data.branch2_staff || ""}</td>
                        <td>${data.branch2_membership || ""}</td>
                        <td>${data.branch2_address || ""}</td>
                        <td>${data.branch2_assurance || ""}</td>
                    </tr>
                    <tr>
                        <td>3</td>
                        <td>${data.branch3_member || ""}</td>
                        <td>${data.branch3_staff || ""}</td>
                        <td>${data.branch3_membership || ""}</td>
                        <td>${data.branch3_address || ""}</td>
                        <td>${data.branch3_assurance || ""}</td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Section 15 -->
            <div class="section-title">
                15. (i). How is the control procedure followed by the Branch/es?
            </div>
            <div class="control-procedure dotted-field">
                ${data.control_procedure || ""}
            </div>
            
            <div class="section-title " >
                (ii). And whether any periodic sample testing of clients handled by branch/es is done by HO?
            </div>
            <div class="control-procedure dotted-field">
                ${data.sample_testing || ""}
            </div>
            
            <!-- Section 16 -->
            <div class="section-title">
                16. Gross receipts of the Practice Unit [both H.O. and branch(es)] as per books of accounts from assurance functions for the period under review. In case of centralized billing the branch turnover may be added with HO, otherwise separate figures (Rs. in Lakhs) to be given:
            </div>
            
            <table class="receipts-table">
                <tbody>
                    <tr>
                        <td style="width: 25.64%;">Financial Year</td>
                        <td style="width: 18.58%;">Head Office</td>
                        <td style="width: 18.6%;">Branch 1</td>
                        <td style="width: 18.58%;">Branch 2</td>
                        <td style="width: 18.6%;">Branch 3</td>
                    </tr>
                    <tr>
                        <td>${data.fy1_year || ""}</td>
                        <td>${data.fy1_ho || ""}</td>
                        <td>${data.fy1_branch1 || ""}</td>
                        <td>${data.fy1_branch2 || ""}</td>
                        <td>${data.fy1_branch3 || ""}</td>
                    </tr>
                    <tr>
                        <td>${data.fy2_year || ""}</td>
                        <td>${data.fy2_ho || ""}</td>
                        <td>${data.fy2_branch1 || ""}</td>
                        <td>${data.fy2_branch2 || ""}</td>
                        <td>${data.fy2_branch3 || ""}</td>
                    </tr>
                    <tr>
                        <td>${data.fy3_year || ""}</td>
                        <td>${data.fy3_ho || ""}</td>
                        <td>${data.fy3_branch1 || ""}</td>
                        <td>${data.fy3_branch2 || ""}</td>
                        <td>${data.fy3_branch3 || ""}</td>
                    </tr>
                </tbody>
            </table>
            
            <p class="text-center" style="margin-top: 12pt; margin-bottom: 5pt;">
                OR
            </p>
            
            <div class="section-title">
                Total Gross receipts of the Practice Unit [both H.O. and branch(es)] as per books of accounts for the period under review. In case of centralized billing the branch turnover may be added with HO otherwise separate figures (Rs. in Lakhs) to be given:
            </div>
            
            <table class="receipts-table">
                <tbody>
                    <tr>
                        <td style="width: 25.64%;">Financial Year</td>
                        <td style="width: 18.58%;">Head Office</td>
                        <td style="width: 18.6%;">Branch 1</td>
                        <td style="width: 18.58%;">Branch 2</td>
                        <td style="width: 18.6%;">Branch 3</td>
                    </tr>
                    <tr>
                        <td>${data.total_fy1_year || ""}</td>
                        <td>${data.total_fy1_ho || ""}</td>
                        <td>${data.total_fy1_branch1 || ""}</td>
                        <td>${data.total_fy1_branch2 || ""}</td>
                        <td>${data.total_fy1_branch3 || ""}</td>
                    </tr>
                    <tr>
                        <td>${data.total_fy2_year || ""}</td>
                        <td>${data.total_fy2_ho || ""}</td>
                        <td>${data.total_fy2_branch1 || ""}</td>
                        <td>${data.total_fy2_branch2 || ""}</td>
                        <td>${data.total_fy2_branch3 || ""}</td>
                    </tr>
                    <tr>
                        <td>${data.total_fy3_year || ""}</td>
                        <td>${data.total_fy3_ho || ""}</td>
                        <td>${data.total_fy3_branch1 || ""}</td>
                        <td>${data.total_fy3_branch2 || ""}</td>
                        <td>${data.total_fy3_branch3 || ""}</td>
                    </tr>
                </tbody>
            </table>
        </div>

            <!-- Page No 8 -->
        <!-- Section 17 -->
            <div class="section-title page-break">
                17. Concentration: Furnish details where professional fees from any client exceed 15% of the PU's total gross receipts:
            </div>
            
            <table class="concentration-table">
                <tbody>
                    <tr>
                        <td style="width: 25%;">Name or code number of the Client</td>
                        <td style="width: 25%;">Type of Service (Assurance / Non Assurance)</td>
                        <td style="width: 25%;">% of PU's total gross receipts</td>
                        <td style="width: 25.02%;">Financial Year</td>
                    </tr>
                    <tr>
                        <td>${data.client1_name || ""}</td>
                        <td>${data.client1_type || ""}</td>
                        <td>${data.client1_percentage || ""}</td>
                        <td>${data.client1_year || ""}</td>
                    </tr>
                    <tr>
                        <td>${data.client2_name || ""}</td>
                        <td>${data.client2_type || ""}</td>
                        <td>${data.client2_percentage || ""}</td>
                        <td>${data.client2_year || ""}</td>
                    </tr>
                    <tr>
                        <td>${data.client3_name || ""}</td>
                        <td>${data.client3_type || ""}</td>
                        <td>${data.client3_percentage || ""}</td>
                        <td>${data.client3_year || ""}</td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Section 18 -->
            <div class="section-title">
                18. Whether PU has ever undertaken self-evaluation as per 'Digital Competency Maturity Model-2'?
            </div>
            <div class="yes-no-option">
                ${data.self_evaluation === "yes" ? "✓ Yes" : "☐ Yes"}
                ${
                  data.self_evaluation === "yes"
                    ? `If yes, when: ${selfEvalDate}`
                    : ""
                }
                ${data.self_evaluation === "no" ? "✓ No" : "☐ No"}
            </div>
            
            <!-- Section 19 -->
            <div class="section-title">
                19. Has the PU been subjected to a Peer Review in the past?
            </div>
            <div class="yes-no-option">
                ${data.previous_review === "yes" ? "✓ Yes" : "☐ Yes"}
                ${
                  data.previous_review === "yes"
                    ? `Certificate number issued by the Board: ${
                        data.certificate_number || ""
                      }`
                    : ""
                }
                ${data.previous_review === "no" ? "✓ No" : "☐ No"}
            </div>
            
            <!-- Section 20 -->
            <div class="section-title">
                20. Whether any Partner/Employee of Practice Unit has been found guilty by the Disciplinary Committee in the past 3 years in any capacity.
            </div>
            
            <table class="disciplinary-table">
                <tbody>
                    <tr>
                        <td style="width: 25%;">Name of Partner/Employee</td>
                        <td style="width: 25%;">Membership No.</td>
                        <td style="width: 25%;">Case No.</td>
                        <td style="width: 25.02%;">Whether found guilty YES/NO</td>
                    </tr>
                    <tr>
                        <td>${data.disciplinary1_name || ""}</td>
                        <td>${data.disciplinary1_membership || ""}</td>
                        <td>${data.disciplinary1_case || ""}</td>
                        <td>${data.disciplinary1_guilty || ""}</td>
                    </tr>
                    <tr>
                        <td>${data.disciplinary2_name || ""}</td>
                        <td>${data.disciplinary2_membership || ""}</td>
                        <td>${data.disciplinary2_case || ""}</td>
                        <td>${data.disciplinary2_guilty || ""}</td>
                    </tr>
                    <tr>
                        <td>${data.disciplinary3_name || ""}</td>
                        <td>${data.disciplinary3_membership || ""}</td>
                        <td>${data.disciplinary3_case || ""}</td>
                        <td>${data.disciplinary3_guilty || ""}</td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Section 21 -->
            <div class="section-title">
                21. Whether any client obtained through the process of tendering?
            </div>
            <div class="yes-no-option">
                ${data.tender_clients === "yes" ? "✓ Yes" : "☐ Yes"}
                ${data.tender_clients === "no" ? "✓ No" : "☐ No"}
            </div>
            
            <!-- Section 22 -->
            <div class="section-title">
                22. Please provide details of assurance clients where report/certificate has been <u>signed during the period under review</u>, financial year wise and branch wise as per Annexure A (Please use additional sheet for year-wise details):
            </div>
            

            <!-- Page No 9 -->

            <p class="text-center page-break"><strong>ANNEXURE A</strong></p>
        <p class="note"><strong>Note: The clients obtained through <u>tender</u> may please be marked with the word tender in bracket.</strong></p>
        
        <table>
            <thead>
                <tr>
                    <th style="width:6.4%">Sr. No.</th>
                    <th style="width:10.7%">Category of Client<br>(Name or code of client)</th>
                    <th style="width:7.72%">Name of Branch/HO of PU</th>
                    <th style="width:7.52%">Name of Signing Partner</th>
                    <th colspan="3" style="width:26.94%">Type of Engagement*</th>
                    <th style="width:13.82%">Whether Engagement Quality review done?</th>
                    <th style="width:8.42%">Turn over Rs. Lakhs</th>
                    <th style="width:10.86%">Borrowing Rs. Lakhs</th>
                    <th style="width:7.62%">Net worth Rs. Lakhs</th>
                </tr>
                <tr>
                    <td></td>
                    <td></td>
                    <td colspan="2"></td>
                    <td style="width:7.92%">FY....</td>
                    <td style="width:9.5%">FY....</td>
                    <td style="width:9.52%">FY....</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
            </thead>
            <tbody>
                <!-- Category A: Any Bank or Insurance Company -->
                <tr class="section-title">
                    <td><strong>A</strong></td>
                    <td colspan="10"><strong>Any Bank or Insurance Company</strong></td>
                </tr>
                <tr>
                    <td>A1</td>
                    <td>${formatCell(data.categoryA1_client)}</td>
                    <td>${formatCell(data.categoryA1_branch)}</td>
                    <td>${formatCell(data.categoryA1_partner)}</td>
                    <td>${formatCell(data.categoryA1_engagement1)}</td>
                    <td>${formatCell(data.categoryA1_engagement2)}</td>
                    <td>${formatCell(data.categoryA1_engagement3)}</td>
                    <td>${formatCell(data.categoryA1_review)}</td>
                    <td>${formatCell(data.categoryA1_turnover)}</td>
                    <td>${formatCell(data.categoryA1_borrowing)}</td>
                    <td>${formatCell(data.categoryA1_networth)}</td>
                </tr>
                <tr>
                    <td>A2</td>
                    <td>${formatCell(data.categoryA2_client)}</td>
                    <td>${formatCell(data.categoryA2_branch)}</td>
                    <td>${formatCell(data.categoryA2_partner)}</td>
                    <td>${formatCell(data.categoryA2_engagement1)}</td>
                    <td>${formatCell(data.categoryA2_engagement2)}</td>
                    <td>${formatCell(data.categoryA2_engagement3)}</td>
                    <td>${formatCell(data.categoryA2_review)}</td>
                    <td>${formatCell(data.categoryA2_turnover)}</td>
                    <td>${formatCell(data.categoryA2_borrowing)}</td>
                    <td>${formatCell(data.categoryA2_networth)}</td>
                </tr>
                <tr>
                    <td>A3</td>
                    <td>${formatCell(data.categoryA3_client)}</td>
                    <td>${formatCell(data.categoryA3_branch)}</td>
                    <td>${formatCell(data.categoryA3_partner)}</td>
                    <td>${formatCell(data.categoryA3_engagement1)}</td>
                    <td>${formatCell(data.categoryA3_engagement2)}</td>
                    <td>${formatCell(data.categoryA3_engagement3)}</td>
                    <td>${formatCell(data.categoryA3_review)}</td>
                    <td>${formatCell(data.categoryA3_turnover)}</td>
                    <td>${formatCell(data.categoryA3_borrowing)}</td>
                    <td>${formatCell(data.categoryA3_networth)}</td>
                </tr>
                
                <!-- Category B: Non Banking Financial Companies -->
                <tr class="section-title">
                    <td><strong>B</strong></td>
                    <td colspan="10"><strong>Non Banking Financial Companies having public deposits of Rs.100 crore or above.</strong></td>
                </tr>
                <tr>
                    <td>B1</td>
                    <td>${formatCell(data.categoryB1_client)}</td>
                    <td>${formatCell(data.categoryB1_branch)}</td>
                    <td>${formatCell(data.categoryB1_partner)}</td>
                    <td>${formatCell(data.categoryB1_engagement1)}</td>
                    <td>${formatCell(data.categoryB1_engagement2)}</td>
                    <td>${formatCell(data.categoryB1_engagement3)}</td>
                    <td>${formatCell(data.categoryB1_review)}</td>
                    <td>${formatCell(data.categoryB1_turnover)}</td>
                    <td>${formatCell(data.categoryB1_borrowing)}</td>
                    <td>${formatCell(data.categoryB1_networth)}</td>
                </tr>
                <tr>
                    <td>B2</td>
                    <td>${formatCell(data.categoryB2_client)}</td>
                    <td>${formatCell(data.categoryB2_branch)}</td>
                    <td>${formatCell(data.categoryB2_partner)}</td>
                    <td>${formatCell(data.categoryB2_engagement1)}</td>
                    <td>${formatCell(data.categoryB2_engagement2)}</td>
                    <td>${formatCell(data.categoryB2_engagement3)}</td>
                    <td>${formatCell(data.categoryB2_review)}</td>
                    <td>${formatCell(data.categoryB2_turnover)}</td>
                    <td>${formatCell(data.categoryB2_borrowing)}</td>
                    <td>${formatCell(data.categoryB2_networth)}</td>
                </tr>
                <tr>
                    <td>B3</td>
                    <td>${formatCell(data.categoryB3_client)}</td>
                    <td>${formatCell(data.categoryB3_branch)}</td>
                    <td>${formatCell(data.categoryB3_partner)}</td>
                    <td>${formatCell(data.categoryB3_engagement1)}</td>
                    <td>${formatCell(data.categoryB3_engagement2)}</td>
                    <td>${formatCell(data.categoryB3_engagement3)}</td>
                    <td>${formatCell(data.categoryB3_review)}</td>
                    <td>${formatCell(data.categoryB3_turnover)}</td>
                    <td>${formatCell(data.categoryB3_borrowing)}</td>
                    <td>${formatCell(data.categoryB3_networth)}</td>
                </tr>
                
                <!-- Category C: Central or State Public Sector Undertakings -->
                <tr class="section-title">
                    <td><strong>C</strong></td>
                    <td colspan="10"><strong>Central or State Public Sector Undertakings and Central Cooperative Societies having turnover exceeding Rs.250 crore or net worth exceeding Rs.5 crores.</strong></td>
                </tr>
                <tr>
                    <td>C1</td>
                    <td>${formatCell(data.categoryC1_client)}</td>
                    <td>${formatCell(data.categoryC1_branch)}</td>
                    <td>${formatCell(data.categoryC1_partner)}</td>
                    <td>${formatCell(data.categoryC1_engagement1)}</td>
                    <td>${formatCell(data.categoryC1_engagement2)}</td>
                    <td>${formatCell(data.categoryC1_engagement3)}</td>
                    <td>${formatCell(data.categoryC1_review)}</td>
                    <td>${formatCell(data.categoryC1_turnover)}</td>
                    <td>${formatCell(data.categoryC1_borrowing)}</td>
                    <td>${formatCell(data.categoryC1_networth)}</td>
                </tr>
                <tr>
                    <td>C2</td>
                    <td>${formatCell(data.categoryC2_client)}</td>
                    <td>${formatCell(data.categoryC2_branch)}</td>
                    <td>${formatCell(data.categoryC2_partner)}</td>
                    <td>${formatCell(data.categoryC2_engagement1)}</td>
                    <td>${formatCell(data.categoryC2_engagement2)}</td>
                    <td>${formatCell(data.categoryC2_engagement3)}</td>
                    <td>${formatCell(data.categoryC2_review)}</td>
                    <td>${formatCell(data.categoryC2_turnover)}</td>
                    <td>${formatCell(data.categoryC2_borrowing)}</td>
                    <td>${formatCell(data.categoryC2_networth)}</td>
                </tr>
                <tr>
                    <td>C3</td>
                    <td>${formatCell(data.categoryC3_client)}</td>
                    <td>${formatCell(data.categoryC3_branch)}</td>
                    <td>${formatCell(data.categoryC3_partner)}</td>
                    <td>${formatCell(data.categoryC3_engagement1)}</td>
                    <td>${formatCell(data.categoryC3_engagement2)}</td>
                    <td>${formatCell(data.categoryC3_engagement3)}</td>
                    <td>${formatCell(data.categoryC3_review)}</td>
                    <td>${formatCell(data.categoryC3_turnover)}</td>
                    <td>${formatCell(data.categoryC3_borrowing)}</td>
                    <td>${formatCell(data.categoryC3_networth)}</td>
                </tr>
                
                <!-- Category D: Listed Enterprises -->
                <tr class="section-title">
                    <td><strong>D</strong></td>
                    <td colspan="10"><strong>Enterprise which is listed in India or Abroad as defined under SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015.</strong></td>
                </tr>
                <tr>
                    <td>D1</td>
                    <td>${formatCell(data.categoryD1_client)}</td>
                    <td>${formatCell(data.categoryD1_branch)}</td>
                    <td>${formatCell(data.categoryD1_partner)}</td>
                    <td>${formatCell(data.categoryD1_engagement1)}</td>
                    <td>${formatCell(data.categoryD1_engagement2)}</td>
                    <td>${formatCell(data.categoryD1_engagement3)}</td>
                    <td>${formatCell(data.categoryD1_review)}</td>
                    <td>${formatCell(data.categoryD1_turnover)}</td>
                    <td>${formatCell(data.categoryD1_borrowing)}</td>
                    <td>${formatCell(data.categoryD1_networth)}</td>
                </tr>
                <tr>
                    <td>D2</td>
                    <td>${formatCell(data.categoryD2_client)}</td>
                    <td>${formatCell(data.categoryD2_branch)}</td>
                    <td>${formatCell(data.categoryD2_partner)}</td>
                    <td>${formatCell(data.categoryD2_engagement1)}</td>
                    <td>${formatCell(data.categoryD2_engagement2)}</td>
                    <td>${formatCell(data.categoryD2_engagement3)}</td>
                    <td>${formatCell(data.categoryD2_review)}</td>
                    <td>${formatCell(data.categoryD2_turnover)}</td>
                    <td>${formatCell(data.categoryD2_borrowing)}</td>
                    <td>${formatCell(data.categoryD2_networth)}</td>
                </tr>
                <tr>
                    <td>D3</td>
                    <td>${formatCell(data.categoryD3_client)}</td>
                    <td>${formatCell(data.categoryD3_branch)}</td>
                    <td>${formatCell(data.categoryD3_partner)}</td>
                    <td>${formatCell(data.categoryD3_engagement1)}</td>
                    <td>${formatCell(data.categoryD3_engagement2)}</td>
                    <td>${formatCell(data.categoryD3_engagement3)}</td>
                    <td>${formatCell(data.categoryD3_review)}</td>
                    <td>${formatCell(data.categoryD3_turnover)}</td>
                    <td>${formatCell(data.categoryD3_borrowing)}</td>
                    <td>${formatCell(data.categoryD3_networth)}</td>
                </tr>
                
                <!-- Category E: Asset Management Companies -->
                <tr class="section-title">
                    <td><strong>E</strong></td>
                    <td colspan="10"><strong>Asset Management Companies or Mutual Funds.</strong></td>
                </tr>
                <tr>
                    <td>E1</td>
                    <td>${formatCell(data.categoryE1_client)}</td>
                    <td>${formatCell(data.categoryE1_branch)}</td>
                    <td>${formatCell(data.categoryE1_partner)}</td>
                    <td>${formatCell(data.categoryE1_engagement1)}</td>
                    <td>${formatCell(data.categoryE1_engagement2)}</td>
                    <td>${formatCell(data.categoryE1_engagement3)}</td>
                    <td>${formatCell(data.categoryE1_review)}</td>
                    <td>${formatCell(data.categoryE1_turnover)}</td>
                    <td>${formatCell(data.categoryE1_borrowing)}</td>
                    <td>${formatCell(data.categoryE1_networth)}</td>
                </tr>
                <tr>
                    <td>E2</td>
                    <td>${formatCell(data.categoryE2_client)}</td>
                    <td>${formatCell(data.categoryE2_branch)}</td>
                    <td>${formatCell(data.categoryE2_partner)}</td>
                    <td>${formatCell(data.categoryE2_engagement1)}</td>
                    <td>${formatCell(data.categoryE2_engagement2)}</td>
                    <td>${formatCell(data.categoryE2_engagement3)}</td>
                    <td>${formatCell(data.categoryE2_review)}</td>
                    <td>${formatCell(data.categoryE2_turnover)}</td>
                    <td>${formatCell(data.categoryE2_borrowing)}</td>
                    <td>${formatCell(data.categoryE2_networth)}</td>
                </tr>
                <tr>
                    <td>E3</td>
                    <td>${formatCell(data.categoryE3_client)}</td>
                    <td>${formatCell(data.categoryE3_branch)}</td>
                    <td>${formatCell(data.categoryE3_partner)}</td>
                    <td>${formatCell(data.categoryE3_engagement1)}</td>
                    <td>${formatCell(data.categoryE3_engagement2)}</td>
                    <td>${formatCell(data.categoryE3_engagement3)}</td>
                    <td>${formatCell(data.categoryE3_review)}</td>
                    <td>${formatCell(data.categoryE3_turnover)}</td>
                    <td>${formatCell(data.categoryE3_borrowing)}</td>
                    <td>${formatCell(data.categoryE3_networth)}</td>
                </tr>
                
                <!-- Category F: Ind AS Entities -->
                <tr class="section-title">
                    <td><strong>F</strong></td>
                    <td colspan="10"><strong>Entities preparing the financial statements as per Ind AS.</strong></td>
                </tr>
                <tr>
                    <td>F1</td>
                    <td>${formatCell(data.categoryF1_client)}</td>
                    <td>${formatCell(data.categoryF1_branch)}</td>
                    <td>${formatCell(data.categoryF1_partner)}</td>
                    <td>${formatCell(data.categoryF1_engagement1)}</td>
                    <td>${formatCell(data.categoryF1_engagement2)}</td>
                    <td>${formatCell(data.categoryF1_engagement3)}</td>
                    <td>${formatCell(data.categoryF1_review)}</td>
                    <td>${formatCell(data.categoryF1_turnover)}</td>
                    <td>${formatCell(data.categoryF1_borrowing)}</td>
                    <td>${formatCell(data.categoryF1_networth)}</td>
                </tr>
                <tr>
                    <td>F2</td>
                    <td>${formatCell(data.categoryF2_client)}</td>
                    <td>${formatCell(data.categoryF2_branch)}</td>
                    <td>${formatCell(data.categoryF2_partner)}</td>
                    <td>${formatCell(data.categoryF2_engagement1)}</td>
                    <td>${formatCell(data.categoryF2_engagement2)}</td>
                    <td>${formatCell(data.categoryF2_engagement3)}</td>
                    <td>${formatCell(data.categoryF2_review)}</td>
                    <td>${formatCell(data.categoryF2_turnover)}</td>
                    <td>${formatCell(data.categoryF2_borrowing)}</td>
                    <td>${formatCell(data.categoryF2_networth)}</td>
                </tr>
                <tr>
                    <td>F3</td>
                    <td>${formatCell(data.categoryF3_client)}</td>
                    <td>${formatCell(data.categoryF3_branch)}</td>
                    <td>${formatCell(data.categoryF3_partner)}</td>
                    <td>${formatCell(data.categoryF3_engagement1)}</td>
                    <td>${formatCell(data.categoryF3_engagement2)}</td>
                    <td>${formatCell(data.categoryF3_engagement3)}</td>
                    <td>${formatCell(data.categoryF3_review)}</td>
                    <td>${formatCell(data.categoryF3_turnover)}</td>
                    <td>${formatCell(data.categoryF3_borrowing)}</td>
                    <td>${formatCell(data.categoryF3_networth)}</td>
                </tr>
                
                <!-- Category G: Other Public Interest Entities -->
                <tr class="section-title">
                    <td><strong>G</strong></td>
                    <td colspan="10"><strong>Any Body corporate including trusts which are covered under public interest entities.</strong></td>
                </tr>
            </tbody>
        </table>
        
        <!--Page No 10 -->

        <h2>List of Entities</h2>
        <table>
            <tbody>
                <!-- G Category -->
                <tr>
                    <td style="width:6.4%;"><strong>G1</strong></td>
                    <td colspan="10" style="width:93.6%;">
                        <strong>Listed entities</strong>
                    </td>
                </tr>
                ${generateEntityRows(data, "g1", 3)}
                
                <!-- H Category -->
                <tr>
                    <td style="width:6.4%;"><strong>H</strong></td>
                    <td colspan="10" style="width:93.6%;">
                        <strong>Entities which have raised funds from public or banks or financial institutions or by way of donations/contributions over Fifty Crores rupees during the period under review.</strong>
                    </td>
                </tr>
                ${generateEntityRows(data, "h1", 3)}
                
                <!-- I Category -->
                <tr>
                    <td style="width:6.4%;"><strong>I</strong></td>
                    <td colspan="10" style="width:93.6%;">
                        <strong>Entities which have been funded by Central and / or State Government(s) schemes of over Rs.50 crores during the period under review.</strong>
                    </td>
                </tr>
                ${generateEntityRows(data, "i1", 3)}
                
                <!-- J Category -->
                <tr>
                    <td style="width:6.4%;"><strong>J</strong></td>
                    <td colspan="10" style="width:93.6%;">
                        <strong>Entities having Net Worth of more than Rs.100 Crores rupees or having turnover of Rs.250 crore or above during the period under review.</strong>
                    </td>
                </tr>
                ${generateEntityRows(data, "j1", 3)}
                
                <!-- K Category -->
                <tr>
                    <td style="width:6.4%;"><strong>K</strong></td>
                    <td colspan="10" style="width:93.6%;">
                        <strong>Any other</strong>
                    </td>
                </tr>
                ${generateEntityRows(data, "k1", 3)}
            </tbody>
        </table>

        <!-- Type of engagement-->
        <p style="margin-top: 20px;">
                <strong>*Type of engagement (1) Central Statutory Audit (CSA), (2) Statutory Audit (SA), (3) Tax Audit (TA), (4) Internal Audit (IA), (5) Others</strong>
                (Concurrent, GST, certification work etc.)
            </p>
            <p style="margin-left: 27.0pt; text-indent: -27.05pt;">
                Note: Type of assurance service engagements include Central Statutory Audit, Statutory Audit, Tax Audit, GST Audit, Internal Audit, Certification work but does not include:
            </p>
            <ol style="list-style-type: lower-roman; margin-left: 44.4px;">
                <li>Management consultancy Engagements;</li>
                <li>Representation before various authorities;</li>
                <li>Engagements to prepare tax return or advising clients in taxation matter;</li>
                <li>Engagements for the compilation of financial statement;</li>
            </ol>

            <!-- Form 1 Page No 1 to 10 End -->
        
            <!-- Form 1 Page No 26 to 30 --> 
                <!-- Page No 26 -->

            <table class="page-break">
                <thead >
                    <tr>
                        <th>S.No.</th>
                        <th>Policies and Procedures</th>
                        <th class="remarks-col">REMARKS/YES/NO/NA</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="text-align: center;">d)</td>
                        <td>Whether checklist of relevant Laws/Rules including those related with Accountancy & audit is shared with the engagement team?</td>
                        <td>
                            <p>${getRadioValue("checklist_shared")}</p>
                            <p>${data.checklist_shared_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">e)</td>
                        <td>Whether industry briefing about nature, structure & vertical, and important points from previous year audit summary memorandum are provided to team during planning of the engagement?</td>
                        <td>
                            <p>${getRadioValue("industry_briefing")}</p>
                            <p>${data.industry_briefing_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">f)</td>
                        <td>Any other (pls. specify) ${
                          data.other_specify || ""
                        }</td>
                        <td>
                            <p>${getRadioValue("other")}</p>
                            <p>${data.other_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">2.</td>
                        <td>Does the PU conduct pre-assignment meeting with the clients, liaison office etc. to understand the preparedness of the client to start the professional functions.</td>
                        <td>
                            <p>${getRadioValue("pre_assignment_meeting")}</p>
                            <p>${data.pre_assignment_meeting_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">3.</td>
                        <td>Does the PU prepare and document Audit Summary Memorandum to provide the history of the planned risks, the audit procedures which mitigated the risk, conclusions on controls etc.?</td>
                        <td>
                            <p>${getRadioValue("audit_summary")}</p>
                            <p>${data.audit_summary_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">4.</td>
                        <td>Does the PU prepare standardized forms, checklists and questionnaires used in performance engagements?</td>
                        <td>
                            <p>${getRadioValue("standardized_forms")}</p>
                            <p>${data.standardized_forms_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">5.</td>
                        <td>Does the team leader/Engagement Partner keep a track of the audit findings, other significant issues at various stages of the engagement (including disposal/discussion with the TCWG)?</td>
                        <td>
                            <p>${getRadioValue("track_findings")}</p>
                            <p>${data.track_findings_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">6.</td>
                        <td>How does the PU ensure that</td>
                        <td>
                            <p>${data.general_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">i)</td>
                        <td>the qualified team members review the work performed by other team members on a timely basis?</td>
                        <td>
                            <p>${getRadioValue("team_review")}</p>
                            <p>${data.team_review_remarks || ""}</p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Page No 27 -->
            <table class="page-break">
                <tbody>
                    <tr>
                        <td style="width: 6%; text-align: center;"><strong>S.No.</strong></td>
                        <td style="width: 51.4093%;"><strong>Policies and Procedures</strong></td>
                        <td style="width: 34.56%;"><strong>REMARKS/YES/NO/NA</strong></td>
                    </tr>
                    <tr>
                        <td style="width: 6%; text-align: right;">(ii)</td>
                        <td style="width: 51.4093%;">
                            Is there any document maintained by the PU for the supervision of work performed?
                        </td>
                        <td style="width: 34.56%;">
                            <p>${getRadioValue("supervision_doc")}</p>
                            <p>${data.supervision_doc_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 6%; text-align: center;">7.</td>
                        <td style="width: 51.4093%;">
                            What is the mode for maintaining the working papers? Electronic mode or in physical form or in a hybrid manner?
                        </td>
                        <td style="width: 34.56%;">
                            <p>${data.working_paper_mode || "Not specified"}</p>
                            <p>${data.working_paper_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 6%; text-align: center;">8.</td>
                        <td style="width: 51.4093%;">
                            What tool does the PU use for maintaining the working in electronic form?
                        </td>
                        <td style="width: 34.56%;">
                            <p>${data.electronic_tool || "Not specified"}</p>
                            <p>${data.electronic_tool_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 6%; text-align: center;">9.</td>
                        <td style="width: 51.4093%;">
                            <strong>Which of the following procedures does the PU have in place to maintain confidentiality, safe custody, integrity, accessibility and retrievability of engagement documentation:</strong>
                        </td>
                        <td style="width: 34.56%;">
                            <p>${
                              data.documentation_procedures_remarks || ""
                            }</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 6%; text-align: right;">(i)</td>
                        <td style="width: 51.4093%;">
                            Documenting when and by whom the engagement documentation was prepared and reviewed
                        </td>
                        <td style="width: 34.56%;">
                            <p>${getRadioValue("doc_prep_review")}</p>
                            <p>${data.doc_prep_review_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 6%; text-align: right;">(ii)</td>
                        <td style="width: 51.4093%;">
                            Protecting integrity of information at all stages of engagement especially when the information was shared through electronic means
                        </td>
                        <td style="width: 34.56%;">
                            <p>${getRadioValue("info_integrity")}</p>
                            <p>${data.info_integrity_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 6%; text-align: right;">(iii)</td>
                        <td style="width: 51.4093%;">
                            Preventing unauthorized changes in engagement documentation
                        </td>
                        <td style="width: 34.56%;">
                            <p>${getRadioValue("prevent_unauthorized")}</p>
                            <p>${data.prevent_unauthorized_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 6%; text-align: right;">(iv)</td>
                        <td style="width: 51.4093%;">
                            Allowing access to engagement documentation by engagement team and other authorized parties only
                        </td>
                        <td style="width: 34.56%;">
                            <p>${getRadioValue("access_control")}</p>
                            <p>${data.access_control_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 6%; text-align: right;">(v)</td>
                        <td style="width: 51.4093%;">
                            Enabling confidential storage of hardcopies of engagement documentation
                        </td>
                        <td style="width: 34.56%;">
                            <p>${getRadioValue("hardcopy_storage")}</p>
                            <p>${data.hardcopy_storage_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 6%; text-align: right;">(vi)</td>
                        <td style="width: 51.4093%;">
                            Requiring use of passwords by engagement team members and data encryption to restrict access to electronic engagement documentation to authorized users
                        </td>
                        <td style="width: 34.56%;">
                            <p>${getRadioValue("password_encryption")}</p>
                            <p>${data.password_encryption_remarks || ""}</p>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Page No 28 -->
            <table class="page-break">
                <tbody>
                    <tr>
                        <td style="width: 6.1227%; text-align: center;"><strong>S.No</strong></td>
                        <td style="width: 55.3745%;"><strong>Policies and Procedures</strong></td>
                        <td style="width: 36.7729%;"><strong>REMARKS/YES/NO/NA</strong></td>
                    </tr>
                    <tr>
                        <td style="width: 6.1227%; text-align: right;">(vii)</td>
                        <td style="width: 55.3745%;">
                            Maintaining appropriate backup routines at appropriate stages during the engagement
                        </td>
                        <td style="width: 36.7729%;">
                            <p>${getRadioValue("backup_routines")}</p>
                            <p>${data.backup_routines_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 6.1227%; text-align: right;">(viii)</td>
                        <td style="width: 55.3745%;">
                            Enabling the scanned copies to be retrieved and printed by authorized personnel
                        </td>
                        <td style="width: 36.7729%;">
                            <p>${getRadioValue("scanned_copies")}</p>
                            <p>${data.scanned_copies_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 6.1227%; text-align: center;">10.</td>
                        <td style="width: 55.3745%;">
                            <strong>Which procedures does the PU follow to ensure that it maintains engagement documentation for a period of time sufficient to meet the needs of the firm, professional standards, laws and regulations:</strong>
                        </td>
                        <td style="width: 36.7729%;">
                            <p>${data.document_retention_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 6.1227%; text-align: right;">(i)</td>
                        <td style="width: 55.3745%;">
                            For how many years the PU maintains engagement documentation?
                        </td>
                        <td style="width: 36.7729%;">
                            <p>${
                              data.retention_years || "Not specified"
                            } years</p>
                            <p>${data.retention_years_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 6.1227%; text-align: right;">(ii)</td>
                        <td style="width: 55.3745%;">
                            How does the PU enable retrieval of, and access to engagement documentation during the retention period in case of electronic documentation as the underlying technology may be upgraded or changed overtime
                        </td>
                        <td style="width: 36.7729%;">
                            <p>${data.retrieval_method || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 6.1227%; text-align: right;">(iii)</td>
                        <td style="width: 55.3745%;">
                            Does the PU ensure that, record of changes made to engagement documentation after assembly of files has been completed?
                        </td>
                        <td style="width: 36.7729%;">
                            <p>${getRadioValue("change_records")}</p>
                            <p>${data.change_records_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 6.1227%; text-align: right;">(iv)</td>
                        <td style="width: 55.3745%;">
                            Does the PU ensure that only authorized external parties access and review specific engagement documentation for QC or other purposes?
                        </td>
                        <td style="width: 36.7729%;">
                            <p>${getRadioValue("external_access")}</p>
                            <p>${data.external_access_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 6.1227%; text-align: center;">11.</td>
                        <td style="width: 55.3745%;">
                            Does the PU have the policy for documenting the issue requiring consultation, including any decisions that were taken, the basis for those decisions and how they were implemented?
                        </td>
                        <td style="width: 36.7729%;">
                            <p>${getRadioValue("consultation_policy")}</p>
                            <p>${data.consultation_policy_remarks || ""}</p>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Page No 29 -->

         <table class="page-break">
                <tbody>
                    <tr>
                        <td style="width: 7.1382%; text-align: center;"><strong>S.No.</strong></td>
                        <td style="width: 56.8145%;"><strong>Policies and Procedures</strong></td>
                        <td style="width: 34.4827%;"><strong>REMARKS/YES/NO/NA</strong></td>
                    </tr>
                    <tr>
                        <td style="width: 7.1382%; text-align: center;">12.</td>
                        <td style="width: 56.8145%;">
                            Who resolves with the differences of professional judgement among members of the engagement team?
                        </td>
                        <td style="width: 34.4827%;">
                            <p>${data.judgement_resolver || "Not specified"}</p>
                            <p>${data.judgement_resolver_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 7.1382%; text-align: center;">13.</td>
                        <td style="width: 56.8145%;">
                            Is there a formally designed an escalation matrix, in case the differences are not resolved at certain level?
                        </td>
                        <td style="width: 34.4827%;">
                            <p>${getRadioValue("escalation_matrix")}</p>
                            <p>${data.escalation_matrix_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 7.1382%; text-align: center;">14.</td>
                        <td style="width: 56.8145%;">
                            Are the conclusions reached properly documented?
                        </td>
                        <td style="width: 34.4827%;">
                            <p>${getRadioValue("conclusions_documented")}</p>
                            <p>${data.conclusions_documented_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 7.1382%; text-align: center;">15.</td>
                        <td style="width: 56.8145%;">
                            What happens if the members of the team continue to disagree with the resolution?
                        </td>
                        <td style="width: 34.4827%;">
                            <p>${data.disagreement_procedure || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 7.1382%; text-align: center;">16.</td>
                        <td style="width: 56.8145%;">
                            When does the PU release the report in cases where differences in opinion exist?
                        </td>
                        <td style="width: 34.4827%;">
                            <p>${data.report_release_policy || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 7.1382%; text-align: center;">17.</td>
                        <td style="width: 56.8145%;">
                            Does the PU have a policy of having engagement quality review conducted for all audit of financial statements of listed entities?
                        </td>
                        <td style="width: 34.4827%;">
                            <p>${getRadioValue("quality_review_policy")}</p>
                            <p>${data.quality_review_policy_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 7.1382%; text-align: center;">18.</td>
                        <td style="width: 56.8145%;">
                            <strong>Which of the criteria does the PU have in place for carrying out the engagement QC review for its engagements (other than covered above):</strong>
                        </td>
                        <td style="width: 34.4827%;">
                            <p>${data.qc_criteria_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 7.1382%; text-align: right;">(i)</td>
                        <td style="width: 56.8145%;">
                            Certain class of engagements (mention the class)
                        </td>
                        <td style="width: 34.4827%;">
                            <p>${data.engagement_class || "Not specified"}</p>
                            <p>${data.engagement_class_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 7.1382%; text-align: right;">(ii)</td>
                        <td style="width: 56.8145%;">
                            Risks in an engagement (mention type/level)
                        </td>
                        <td style="width: 34.4827%;">
                            <p>${data.risk_type || "Not specified"}</p>
                            <p>${data.risk_type_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 7.1382%; text-align: right;">(iii)</td>
                        <td style="width: 56.8145%;">
                            Unusual circumstances (mention the particular circumstance)
                        </td>
                        <td style="width: 34.4827%;">
                            <p>${
                              data.unusual_circumstances || "Not specified"
                            }</p>
                            <p>${data.unusual_circumstances_remarks || ""}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 7.1382%; text-align: right;">(iv)</td>
                        <td style="width: 56.8145%;">
                            Required by law or regulation (quote the law/regulation)
                        </td>
                        <td style="width: 34.4827%;">
                            <p>${data.law_regulation || "Not specified"}</p>
                            <p>${data.law_regulation_remarks || ""}</p>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Page No 30 -->
                            

            <table class="page-break">
            <tbody>
                <tr>
                    <td style="width: 7.2423%;"><strong>S.No</strong></td>
                    <td style="width: 57.3345%;"><strong>Policies and Procedures</strong></td>
                    <td style="width: 35.3417%;"><strong>REMARKS/YES/NO/NA</strong></td>
                </tr>
                <tr>
                    <td class="text-right">(v)</td>
                    <td>Any other like size (pls. elaborate)</td>
                    <td class="remarks-col">${data.other_like_size || ""}</td>
                </tr>
                <tr>
                    <td class="text-center">19.</td>
                    <td><strong>Which of the following procedures are followed by the PU for addressing the nature, timing, extent, and documentation of engagement QC review:</strong></td>
                    <td class="remarks-col"></td>
                </tr>
                <tr>
                    <td class="text-right">(i)</td>
                    <td>Discuss significant accounting, auditing and financial reporting issues with the engagement partner</td>
                    <td class="remarks-col"><span class="checkbox">${getDisplayValue(
                      data.procedure_1
                    )}</span></td>
                </tr>
                <tr>
                    <td class="text-right">(ii)</td>
                    <td>Discuss with the EP the engagement team's identification and audit of high risk assertions and transactions</td>
                    <td class="remarks-col"><span class="checkbox">${getDisplayValue(
                      data.procedure_2
                    )}</span></td>
                </tr>
                <tr>
                    <td class="text-right">(iii)</td>
                    <td>Confirm with the EP that there are no significant unresolved issues</td>
                    <td class="remarks-col"><span class="checkbox">${getDisplayValue(
                      data.procedure_3
                    )}</span></td>
                </tr>
                <tr>
                    <td class="text-right">(iv)</td>
                    <td>Read the financial statements and the report and consider whether the report is appropriate</td>
                    <td class="remarks-col"><span class="checkbox">${getDisplayValue(
                      data.procedure_4
                    )}</span></td>
                </tr>
                <tr>
                    <td class="text-right">(v)</td>
                    <td>The procedures required by the firm's policies on engagement QC review have been performed</td>
                    <td class="remarks-col"><span class="checkbox">${getDisplayValue(
                      data.procedure_5
                    )}</span></td>
                </tr>
                <tr>
                    <td class="text-right">(vi)</td>
                    <td>The engagement QC review has been completed before the report is released</td>
                    <td class="remarks-col"><span class="checkbox">${getDisplayValue(
                      data.procedure_6
                    )}</span></td>
                </tr>
                <tr>
                    <td class="text-right">(vii)</td>
                    <td>Resolving conflict between the engagement partner and the engagement QC reviewer regarding significant matters</td>
                    <td class="remarks-col"><span class="checkbox">${getDisplayValue(
                      data.procedure_7
                    )}</span></td>
                </tr>
                <tr>
                    <td class="text-center">20.</td>
                    <td><strong>Which of the following are the PU's established criteria for eligibility of 'Engagement Quality Assurance Reviewers':</strong></td>
                    <td class="remarks-col"></td>
                </tr>
                <tr>
                    <td class="text-right">(i)</td>
                    <td>Selected by QC partner or the Managing Partner</td>
                    <td class="remarks-col"><span class="checkbox">${getDisplayValue(
                      data.criteria_1
                    )}</span></td>
                </tr>
            </tbody>
        </table>

        <!-- Page No 31 -->
        <!-- First Table -->
        <table class="page-break">
            <tbody>
                <tr>
                    <td style="width: 10.076%;"><strong>S.No.</strong></td>
                    <td style="width: 47.5629%;"><strong>Policies and Procedures</strong></td>
                    <td style="width: 34.56%;"><strong>REMARKS/YES/NO/NA</strong></td>
                </tr>
                <tr>
                    <td class="text-right">(ii)</td>
                    <td>Has technical expertise and experience</td>
                    <td class="remarks-col"><span class="checkbox">${getDisplayValue(
                      data.technical_expertise
                    )}</span></td>
                </tr>
                <tr>
                    <td class="text-right">(iii)</td>
                    <td>Carries out the responsibilities with objectivity and due professional care without regard to relative positions</td>
                    <td class="remarks-col"><span class="checkbox">${getDisplayValue(
                      data.objectivity
                    )}</span></td>
                </tr>
                <tr>
                    <td class="text-right">(iv)</td>
                    <td>Meets the independence requirements relating to engagement reviewed</td>
                    <td class="remarks-col"><span class="checkbox">${getDisplayValue(
                      data.independence
                    )}</span></td>
                </tr>
                <tr>
                    <td class="text-right">(v)</td>
                    <td>Does not participate in the performance of the engagement except when consulted by the engagement partner</td>
                    <td class="remarks-col"><span class="checkbox">${getDisplayValue(
                      data.participation
                    )}</span></td>
                </tr>
                <tr>
                    <td class="text-right">(vi)</td>
                    <td>Any other (Pls. specify)</td>
                    <td class="remarks-col">${data.other_specify || ""}</td>
                </tr>
            </tbody>
        </table>

        <!-- Part B (VI) Monitoring Section -->
        <div class="section-title text-center">PART B (VI) Monitoring</div>

        <!-- Second Table -->
        <table class="monitoring-table">
            <thead>
                <tr>
                    <td style="width: 9.0554%;"><strong>S.No.</strong></td>
                    <td style="width: 50.1788%;"><strong>Policies and Procedures</strong></td>
                    <td style="width: 40.6833%;"><strong>Remarks/Yes/No/Na</strong></td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1.(i)</td>
                    <td>Does the PU have Policies and Procedures to confirm on the adequacy and relevance of Quality Control procedures adopted?</td>
                    <td><span class="checkbox">${getDisplayValue(
                      data.qc_procedures
                    )}</span></td>
                </tr>
                <tr>
                    <td>1.(ii)</td>
                    <td>If yes, what document is in place to establish the procedure</td>
                    <td>${data.qc_document || ""}</td>
                </tr>
                <tr>
                    <td>2.</td>
                    <td>Who is responsible to evaluate the Quality and Control policies and procedures to ensure the relevance, adequacy, effectiveness and appropriateness with current trends?</td>
                    <td>${data.responsible_person || ""}</td>
                </tr>
                <tr>
                    <td>3.</td>
                    <td>How frequently are the processes and the procedures related to QC revised?</td>
                    <td>${data.revision_frequency || ""}</td>
                </tr>
                <tr>
                    <td>4.</td>
                    <td>When was the last revision to the Quality Control policies and procedures carried out?</td>
                    <td>${formatDate(data.last_revision_date)}</td>
                </tr>
                <tr>
                    <td>5.(i)</td>
                    <td>Did the PU follow ongoing consideration and evaluation system of quality controls?</td>
                    <td><span class="checkbox">${getDisplayValue(
                      data.ongoing_evaluation
                    )}</span></td>
                </tr>
                <tr>
                    <td>5.(ii)</td>
                    <td>If yes, what document is in place to establish the same</td>
                    <td>${data.evaluation_document || ""}</td>
                </tr>
            </tbody>
        </table>

        <!-- Page No 32 -->

        <style>
            body {
                font-family: "Arial Narrow", sans-serif;
                font-size: 15px;
                line-height: 13.5pt;
                margin: 0;
                padding: 20px;
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
            .text-center {
                text-align: center;
            }
            .dotted-field {
                border-bottom: 1px dotted black;
                display: inline-block;
                min-width: 100px;
            }
            .signature-line {
                margin-top: 50px;
                border-top: 1px solid black;
                width: 200px;
            }
        </style>

        <table class="page-break">
            <tbody>
                <tr>
                    <td style="width: 2.5591%;"></td>
                    <td style="width: 10.2362%; border: 1pt solid windowtext; padding: 0cm 5.4pt; height: 1pt; vertical-align: top;">S.No</td>
                    <td style="width: 39.3722%; border-top: 1pt solid windowtext; border-right: 1pt solid windowtext; border-bottom: 1pt solid windowtext; border-image: initial; border-left: none; padding: 0cm 5.4pt; height: 1pt; vertical-align: top;">Policies and Procedures</td>
                    <td style="width: 14.7911%; border-top: 1pt solid windowtext; border-right: 1pt solid windowtext; border-bottom: 1pt solid windowtext; border-image: initial; border-left: none; padding: 0cm 5.4pt; height: 1pt; vertical-align: top;"></td>
                    <td style="width: 33.0435%; border-top: 1pt solid windowtext; border-right: 1pt solid windowtext; border-bottom: 1pt solid windowtext; border-image: initial; border-left: none; padding: 0cm 5.4pt; height: 1pt; vertical-align: top;">Remarks/Yes/No/Na</td>
                </tr>
                <tr>
                    <td style="border: none; padding: 0cm; width: 2.5591%;"></td>
                    <td style="width: 10.2362%; border: 1pt solid windowtext; padding: 0cm 5.4pt; height: 1pt; vertical-align: top;">
                        <p>6.</p>
                    </td>
                    <td colspan="2" style="width: 54.1612%; border-top: 1pt solid windowtext; border-right: 1pt solid windowtext; border-bottom: 1pt solid windowtext; border-image: initial; border-left: none; padding: 0cm 5.4pt; height: 1pt; vertical-align: top;">
                        <p><strong>Which of the following monitoring procedure, the PU has in place for QC:</strong></p>
                    </td>
                    <td style="width: 33.0435%; border-top: 1pt solid windowtext; border-right: 1pt solid windowtext; border-bottom: 1pt solid windowtext; border-image: initial; border-left: none; padding: 0cm 5.4pt; height: 1pt; vertical-align: top;">
                        <p>&nbsp;</p>
                    </td>
                </tr>
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9]
                  .map((i) => {
                    const key = `qc_monitoring_${
                      i === 9 ? "ix" : "i".repeat(i)
                    }`;
                    const label = [
                      "Designated partner/(s) for performing annual inspection",
                      "Deciding how long to retain detailed inspection documentation",
                      "Reviewing correspondence regarding consultation on independence, integrity and objectivity matters and acceptance and continuance decisions",
                      "Preparing summary inspection report for the partner and sets forth any recommended changes that should be made to the firm's policies and procedures",
                      "Reviewing and evaluating Firm practice aids, such as audit programs, forms, checklists and considering that they are up to date relevant",
                      "Reviewing summary of CPED records of firms professional personnel",
                      "Reviewing other administrative and personnel records pertaining to QC elements",
                      "Soliciting information on the effectiveness of training programs from the Firm's personnel",
                      `Any other (Pls. elaborate) ${
                        i === 9 ? data.qc_monitoring_other_details || "" : ""
                      }`,
                    ][i - 1];

                    return `
                  <tr>
                      <td style="border: none; padding: 0cm; width: 2.5591%;"></td>
                      <td style="width: 10.2362%; border-right: 1pt solid windowtext; border-bottom: 1pt solid windowtext; border-left: 1pt solid windowtext; border-image: initial; border-top: none; padding: 0cm 5.4pt; height: 1pt; vertical-align: top;">
                          <p style="text-align:center;">(${
                            i === 9 ? "ix" : "i".repeat(i)
                          })</p>
                      </td>
                      <td colspan="2" style="width: 54.1612%; border-top: none; border-left: none; border-bottom: 1pt solid windowtext; border-right: 1pt solid windowtext; padding: 0cm 5.4pt; height: 1pt; vertical-align: top;">
                          <p>${label}</p>
                      </td>
                      <td style="width: 33.0435%; border-top: none; border-left: none; border-bottom: 1pt solid windowtext; border-right: 1pt solid windowtext; padding: 0cm 5.4pt; height: 1pt; vertical-align: top;">
                          <p>${data[key] || ""}</p>
                      </td>
                  </tr>`;
                  })
                  .join("")}
                <tr>
                    <td colspan="3" style="width: 52.1674%; border: none; padding: 0cm 5.4pt; vertical-align: top;">
                        <p>Signature</p>
                        <p>${data.signature || ""}</p>
                    </td>
                    <td style="border: none; padding: 0cm; width: 47.6357%;" colspan="2"></td>
                </tr>
                <tr>
                    <td colspan="3" style="width: 52.1674%; border: none; padding: 0cm 5.4pt; vertical-align: top;">
                        <p>Name of Proprietor/Partner/ individual Practicing in own name:</p>
                        <p>${data.signatory_name || ""}</p>
                    </td>
                    <td style="border: none; padding: 0cm; width: 47.6357%;" colspan="2"></td>
                </tr>
                <tr>
                    <td colspan="3" style="width: 52.1674%; border: none; padding: 0cm 5.4pt; vertical-align: top;">
                        <p>Membership No. of the Signatory</p>
                        <p>${data.membership_number || ""}</p>
                    </td>
                    <td style="border: none; padding: 0cm; width: 47.6357%;" colspan="2"></td>
                </tr>
            </tbody>
        </table>
       
        <!-- Page NO 33. -->

        <div class="header page-break">
            <h1>PART C </h1>
            <h1>Scores obtained by self-evaluation using AQMMv1.0</h1>
            <p><strong>[Mandatory Applicable w.e.f 1<sup>st</sup> April 2023 for Practice units conducting statutory audit of listed entities (other than branches of banks and Insurance companies) and recommendatory for other Practice Units]</strong></p>
        </div>

        <!-- Section 1: Practice Management - Operation -->
        <div class="section-title">Section 1: Practice Management – Operation</div>
        
        <table>
            <thead>
                <tr>
                    <th colspan="2">Competency Basis</th>
                    <th>Score Basis</th>
                    <th>Max Scores</th>
                    <th>Scores obtained</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="5"><strong>1.1 Practice Areas of the Firm</strong></td>
                </tr>
                <tr>
                    <td>I</td>
                    <td>Revenue from audit and assurance services</td>
                    <td>
                        <p>(i) 50% to 75% – 5 Points</p>
                        <p>(ii) Above 75% – 8 Points</p>
                    </td>
                    <td class="text-center">8</td>
                    <td class="text-center">${data.revenue_score || "0"}</td>
                </tr>
                <tr>
                    <td>ii</td>
                    <td>Does the firm have a vision and mission statement? Does it address Forward looking practice statements/Plans?</td>
                    <td>
                        <p>For Yes – 4 Points</p>
                        <p>For No – 0 Point</p>
                    </td>
                    <td class="text-center">4</td>
                    <td class="text-center">${data.vision_mission || "0"}</td>
                </tr>
                <tr>
                    <td></td>
                    <td><strong>Total</strong></td>
                    <td></td>
                    <td class="text-center">12</td>
                    <td class="text-center">${data.section1_1_total || "0"}</td>
                </tr>
            </tbody>
        </table>

        <table>
            <thead>
                <tr>
                    <th colspan="2">Competency Basis</th>
                    <th>Score Basis</th>
                    <th>Max Scores</th>
                    <th>Scores obtained</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="5"><strong>1.2 Work Flow - Practice Manuals</strong></td>
                </tr>
                <tr>
                    <td>i.</td>
                    <td>Presence of Audit manuals containing the firm's methodology that ensures compliance with auditing standards and implementation thereof.</td>
                    <td>
                        <p>For Yes – 8 Points</p>
                        <p>For No – 0 Point</p>
                    </td>
                    <td class="text-center">8</td>
                    <td class="text-center">${data.audit_manuals || "0"}</td>
                </tr>
                <tr>
                    <td>ii.</td>
                    <td>
                        Availability of standard formats relevant for audit quality like:
                        <p>- LOE</p>
                        <p>- Representation letter</p>
                        <p>- Significant working papers</p>
                        <p>- Reports and implementation thereof</p>
                    </td>
                    <td>
                        <p>For Yes – 8 Points</p>
                        <p>For No – 0 Point</p>
                    </td>
                    <td class="text-center">8</td>
                    <td class="text-center">${data.standard_formats || "0"}</td>
                </tr>
                <tr>
                    <td></td>
                    <td><strong>Total</strong></td>
                    <td></td>
                    <td class="text-center">16</td>
                    <td class="text-center">${data.section1_2_total || "0"}</td>
                </tr>
            </tbody>
        </table>

        <!-- Page No 34 -->
        <div class="header">
            <p><strong>Quality Review Manuals Section</strong></p>
        </div>

        <!-- Section 1.3: Quality Review Manuals or Audit Tool -->
        <div class="section-title">1.3 Quality Review Manuals or Audit Tool</div>
        
        <table>
            <thead>
                <tr>
                    <th style="width: 6%;">S.No.</th>
                    <th style="width: 54%;">Competency Basics</th>
                    <th style="width: 30%;">Score Basis</th>
                    <th style="width: 5%;">Max Scores</th>
                    <th style="width: 5%;">Scores Obtained</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>i.</td>
                    <td>Usage of Client Acceptance/engagement acceptance checklists and adequate documentation thereof.</td>
                    <td>
                        <p>For Yes – 4 Points</p>
                        <p>For No – 0 Point</p>
                    </td>
                    <td class="text-center">4</td>
                    <td class="text-center">${
                      data.acceptance_checklists || "0"
                    }</td>
                </tr>
                <tr>
                    <td>ii.</td>
                    <td>Evaluation of Independence for all engagements (partners, managers, staff, trainees) based on the extent required. The firm must identify self-interest threat, familiarity threat, intimidation threat, self-review threat, advocacy threat and conflict of interest.</td>
                    <td>
                        <p>For Yes – 4 Points</p>
                        <p>For No – 0 Point</p>
                    </td>
                    <td class="text-center">4</td>
                    <td class="text-center">${
                      data.independence_evaluation || "0"
                    }</td>
                </tr>
                <tr>
                    <td>iii.</td>
                    <td>Does the Firm maintain and use the engagement withdrawal/rejection policy, templates, etc.</td>
                    <td>
                        <p>For Yes – 4 Points</p>
                        <p>For No – 0 Point</p>
                    </td>
                    <td class="text-center">4</td>
                    <td class="text-center">${
                      data.withdrawal_policy || "0"
                    }</td>
                </tr>
                <tr>
                    <td>iv.</td>
                    <td>Availability and use of standard checklists in performance of an Audit for Compliance with Accounting and Auditing Standards</td>
                    <td>
                        <p>For Yes – 4 Points</p>
                        <p>For No – 0 Point</p>
                    </td>
                    <td class="text-center">4</td>
                    <td class="text-center">${
                      data.standard_checklists || "0"
                    }</td>
                </tr>
                <tr>
                    <td>v.</td>
                    <td>Availability and use of standard formats for audit documentation of Business Understanding, Sampling basis, Materiality determination, Data analysis, and Control Evaluation</td>
                    <td>
                        <p>For Yes – 4 Points</p>
                        <p>For No – 0 Point</p>
                    </td>
                    <td class="text-center">4</td>
                    <td class="text-center">${data.standard_formats || "0"}</td>
                </tr>
                <tr>
                    <td>vi.</td>
                    <td>Are the documents related to Quality control mentioned from (i) to (v) above reviewed and updated on a frequent basis (say annually) or with each change in the respective regulation or statute and remedial action taken?</td>
                    <td>
                        <p>For Yes – 4 Points</p>
                        <p>For No – 0 Point</p>
                    </td>
                    <td class="text-center">4</td>
                    <td class="text-center">${
                      data.documents_reviewed || "0"
                    }</td>
                </tr>
                <tr>
                    <td></td>
                    <td><strong>Total</strong></td>
                    <td></td>
                    <td class="text-center">24</td>
                    <td class="text-center">${data.section1_3_total || "0"}</td>
                </tr>
            </tbody>
        </table>


        <!-- Page No 35 -->
        

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
