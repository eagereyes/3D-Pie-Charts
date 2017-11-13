library(dplyr)
library(ggplot2)

lowerCI <- function(v) {
	mean(v) - sd(v)*1.96/sqrt(length(v))
}

upperCI <- function(v) {
	mean(v) + sd(v)*1.96/sqrt(length(v))
}

# aaa = arcs angles areas
aaa <- read.csv("arcs-angles-areas-merged.csv") %>%
	mutate(chart_type = factor(chart_type,
							   levels=c('Pie Chart', 'Donut Chart', 'Arc-Length Chart',  'Area Chart', 'Pie Angle Chart', 'Donut Angle Chart'),
							   labels=c('Pie Chart', 'Donut Chart', 'Arc-Length',  'Area Only', 'Angle Only', 'Angle Only Donut')),
		   judged_true_corrected = ifelse(log_error == log_opposite, judged_true, (100-ans_trial)-correct_ans)
	)

aaaAggregated <- aaa %>%
	group_by(chart_type, subjectID) %>%
	summarize(meanError = mean(judged_true_corrected),
			  meanAbsError = mean(abs(judged_true_corrected)))

#
# Weird Pies Data
#
wpData <- read.csv('weirdpiesresults.csv')

# Filter out the two participants with more opposites
wpDataFiltered <- filter(wpData, resultID != '1481038244717x682752' & resultID != '1481037671383x544646')

#Only look at MTurk data for now
wpDataFiltered <- filter(wpDataFiltered, source == 'mturk')

wpDataFiltered <- mutate(wpDataFiltered,
					   error = answer-percentage,
					   absError = abs(error),
					   relError = absError/percentage,
					   duration = duration/1000,
					   chart_type = factor(variation, c('baseline', 'circular', 'floating-circle', 'circular-center', 'off-center', 'centered-square', 'centered-circle')),
					   subjectID = resultID
)


wpAggregated <- wpDataFiltered %>%
	group_by(subjectID, chart_type) %>%
	summarize(meanError = mean(error), meanAbsError = mean(absError))

allData <- merge(aaaAggregated, wpAggregated, all=T) %>%
	filter(chart_type == 'Pie Chart' | chart_type == 'Area Only' |
		   	chart_type == 'baseline' | chart_type == 'circular') # %>%
#	mutate(chart_type = factor(chart_type, levels=c('Pie Chart', 'baseline', 'Area Only', 'circular'),
#		   									labels=c('Pie Chart Old', 'Pie Chart New', 'Area Only', 'Circular Slice'))
#	)

# Absolute error CIs
ggplot(allData, aes(x=chart_type, y=meanAbsError)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	labs(x = "Variation", y = "Absolute Error")

ggsave("/Users/rkosara/Dropbox (Personal)/Papers/2017/InfoVis – Part-Whole/img/aaa-weird-absolute-error.pdf", width=6, height=4)

# Signed error CIs
ggplot(allData, aes(x=chart_type, y=meanError)) +
	stat_summary(fun.ymin=lowerCI, fun.ymax=upperCI, geom="errorbar", aes(width=.1)) +
	stat_summary(fun.y=mean, geom="point", shape=18, size=3, show.legend = FALSE) +
	geom_hline(yintercept=0, linetype="dotted") +
	labs(x = "Variation", y = "Signed Error")

ggsave("/Users/rkosara/Dropbox (Personal)/Papers/2017/InfoVis – Part-Whole/img/aaa-weird-signed-error.pdf", width=6, height=4)

# ANOVA for absolute error
summary(aov(meanAbsError ~ chart_type, allData))

# ANOVA for signed error
summary(aov(meanError ~ chart_type, allData))

# t-test specifically for the old pie chart against the one in this study
with(allData, t.test(meanAbsError[chart_type == 'Pie Chart'], meanAbsError[chart_type == 'baseline']))
with(allData, t.test(meanError[chart_type == 'Pie Chart'], meanError[chart_type == 'baseline']))

# t-test specifically for the old pie chart against circular
with(allData, t.test(meanAbsError[chart_type == 'baseline'], meanAbsError[chart_type == 'circular']))

with(allData, t.test(meanAbsError[chart_type == 'Pie Chart'], meanAbsError[chart_type == 'Area Only']))


# t-test specifically for the area-only chart against circular
with(allData, t.test(meanAbsError[chart_type == 'Area Only'], meanAbsError[chart_type == 'circular'], alternative = "less"))
with(allData, t.test(meanError[chart_type == 'Area Only'], meanAbsError[chart_type == 'circular'], alternative = "less"))

